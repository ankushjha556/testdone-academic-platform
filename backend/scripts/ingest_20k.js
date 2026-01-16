const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const BATCH_FILE = process.argv[2] && fs.existsSync(process.argv[2])
    ? process.argv[2]
    : path.join(__dirname, 'source_data', 'batch3_pilot.txt');
const BATCH_SIZE = 100; // Increased for 10k
const ADMIN_EMAIL = 'admin@testdone.in';

// Helper: Slugify
const slugify = (text) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

async function parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const blocks = content.split(/\n(?=Q\d+\.)/).filter(b => b.trim());

    const parsed = [];

    for (const block of blocks) {
        try {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);

            // Header: Q15001. SSC MTS/Reasoning – Question Text
            // Fix: Subject can have spaces (e.g. Environment & Pedagogy)
            const headerRegex = /^Q(\d+)\.\s+([^\/]+)\/(.+?)\s+[–-]\s+(.*)/;
            const headerMatch = lines[0].match(headerRegex);

            if (!headerMatch) {
                console.warn(`⚠️ Skipped invalid header: ${lines[0]}`);
                continue;
            }

            const [_, qId, examRaw, subjectRaw, textStart] = headerMatch;

            let questionText = textStart;
            const options = [];
            let answerRaw = null;
            let solution = "";
            let parsingSolution = false;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                const optMatch = line.match(/^([A-D])\.\s+(.*)/);

                if (optMatch) {
                    options.push({ key: optMatch[1], text: optMatch[2] });
                } else if (line.startsWith('Answer:')) {
                    answerRaw = line.split(':')[1].trim(); // "14" or "A"?
                } else if (line.startsWith('Solution:')) {
                    parsingSolution = true;
                    solution = line.split(':')[1].trim();
                } else if (parsingSolution) {
                    solution += ' ' + line;
                } else if (options.length === 0) {
                    questionText += ' ' + line;
                }
            }

            // Determine Correct Option Key
            let correctKey = null;
            if (answerRaw) {
                if (['A', 'B', 'C', 'D'].includes(answerRaw)) {
                    correctKey = answerRaw;
                } else {
                    // Match content
                    const match = options.find(o => o.text == answerRaw || o.text.startsWith(answerRaw));
                    if (match) correctKey = match.key;
                }
            }

            if (options.length !== 4) {
                console.warn(`⚠️ Q${qId} has ${options.length} options. Need 4. Skipping.`);
                continue;
            }
            if (!correctKey) {
                console.warn(`⚠️ Q${qId} Answer "${answerRaw}" not found in options. Skipping.`);
                continue;
            }

            parsed.push({
                qId,
                examRaw: examRaw.trim(),
                subjectRaw: subjectRaw.trim(),
                questionText,
                options,
                correctKey,
                solution
            });

        } catch (e) {
            console.error(`Parse Error:`, e);
        }
    }
    return parsed;
}

async function main() {
    console.log(`🚀 Starting Ingestion Pilot (20k Framework)...`);

    // 0. Metadata Checks
    const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
    if (!admin) throw new Error(`Admin ${ADMIN_EMAIL} not found!`);

    // Load Exams/Subjects
    const exams = await prisma.exam.findMany();
    const subjects = await prisma.subject.findMany();

    // Map Name/Slug -> ID
    // Cache for performance
    const examCache = new Map(exams.map(e => [e.slug, e.id]));
    const subjectCache = new Map(subjects.map(s => [s.slug, s.id]));

    const ensureExam = async (raw) => {
        const s = slugify(raw);
        if (examCache.has(s)) return examCache.get(s);

        // Check by name case-insensitive
        const existing = exams.find(e => e.name.toLowerCase() === raw.toLowerCase());
        if (existing) {
            examCache.set(s, existing.id);
            return existing.id;
        }

        // Create
        console.log(`Creating Header Exam: ${raw}`);
        const newExam = await prisma.exam.create({
            data: {
                name: raw,
                slug: s,
                description: `Auto-created for ${raw}`,
                categoryId: (await prisma.examCategory.findFirst())?.id || 'default_cat_id' // Fallback
            }
        });
        examCache.set(s, newExam.id);
        exams.push(newExam); // Update local cache
        return newExam.id;
    };

    const ensureSubject = async (raw) => {
        const s = slugify(raw);
        if (subjectCache.has(s)) return subjectCache.get(s);

        const existing = subjects.find(sub => sub.name.toLowerCase() === raw.toLowerCase());
        if (existing) {
            subjectCache.set(s, existing.id);
            return existing.id;
        }

        // Create
        console.log(`Creating Header Subject: ${raw}`);
        const newSub = await prisma.subject.create({
            data: { name: raw, slug: s }
        });
        subjectCache.set(s, newSub.id);
        subjects.push(newSub);
        return newSub.id;
    };

    // 1. Parse
    if (!fs.existsSync(BATCH_FILE)) throw new Error(`File ${BATCH_FILE} missing.`);
    const questions = await parseFile(BATCH_FILE);
    console.log(`Parsed ${questions.length} questions.`);

    let stats = { success: 0, skipped: 0, failed: 0 };

    // 2. Insert Batch
    // We use a default Topic or skip topic for now if not explicit?
    // User data said "SSC MTS/Reasoning". "Reasoning" is Subject.
    // We assume Topic is optional or we map to a General topic?
    // Schema: Topic is optional `topicId String?`. OK.

    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        console.log(`Processing Batch ${Math.floor(i / BATCH_SIZE) + 1}...`);

        await prisma.$transaction(async (tx) => {
            for (const q of batch) {
                const examId = await ensureExam(q.examRaw);
                const subjectId = await ensureSubject(q.subjectRaw);

                if (!examId) {
                    console.warn(`SKIP: Exam '${q.examRaw}' not found (Q${q.qId})`);
                    stats.skipped++;
                    continue;
                }
                if (!subjectId) {
                    // Try Mapping heuristics
                    // If Subject is "Reasoning", map to "Reasoning" ID
                    // If not found, log.
                    console.warn(`SKIP: Subject '${q.subjectRaw}' not found (Q${q.qId})`);
                    stats.skipped++;
                    continue;
                }

                // Idempotency
                const existing = await tx.question.findFirst({
                    where: { questionText: q.questionText }
                });

                if (existing) {
                    // console.log(`SKIP: Duplicate Q${q.qId}`);
                    // Ensure mapping?
                    // Safe to skip for now.
                    stats.skipped++;
                    continue;
                }

                // Construct Options JSON
                const optionsJson = q.options.map(o => ({
                    id: o.key,
                    text: o.text,
                    isCorrect: o.key === q.correctKey
                }));

                await tx.question.create({
                    data: {
                        questionText: q.questionText,
                        options: optionsJson, // implicit Json type
                        correctAnswer: q.correctKey, // Storing "A", "B"... or text?
                        // Schema `correctAnswer String?`. `seed_batch2.js` didn't explicitly set `correctAnswer`?
                        // Wait, `seed_batch2.js` lines 188-193 sets `isCorrect` in options.
                        // And checking `seed_batch2.js` line 198: `correctAnswer` was MISSING in `qData`.
                        // IF logic relies on `isCorrect` in JSON, we are good.
                        // But `Question.correctAnswer` exists in schema. It's safe to populate it.
                        // Let's store the Text of the answer? Or the Key?
                        // Previous seeds might have stored Key or Text. 
                        // I will store Key "A", "B"... matching `options.id`.
                        correctAnswer: q.options.find(o => o.key === q.correctKey).text, // Text match as per previous

                        solution: q.solution,
                        difficulty: 'MEDIUM',
                        status: 'PUBLISHED',
                        subjectId: subjectId,
                        createdById: admin.id,
                        questionExams: {
                            create: { examId: examId }
                        }
                    }
                });
                stats.success++;
                process.stdout.write('.');
            }
        });
        console.log('\nBatch Committed.');
    }

    console.log(`\nDONE. Success: ${stats.success}, Skipped: ${stats.skipped}, Failed: ${stats.failed}`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
