const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('🚀 Starting Selective Cleanup & Seeding of Batch 2...');

    // 1. SELECTIVE CLEANUP
    // Delete questions that are NOT linked to any Mock Test (testQuestions relation is empty)
    // This preserves Mock Test 1 & 2 content.
    try {
        console.log('🧹 Cleaning up unlinked questions...');
        const deleteResult = await prisma.question.deleteMany({
            where: {
                testQuestions: {
                    none: {}
                }
            }
        });
        console.log(`✅ Deleted ${deleteResult.count} unlinked/dummy questions.`);

        // Clean up unused Exams (to remove any junk created by bad parsing)
        // Only delete exams that have NO questions.
        // Be careful not to delete Master exams if they are temporarily empty?
        // Actually, if we just deleted 250 questions, their exams might be empty.
        // But we are about to re-seed.
        // Let's delete exams that look like junk? Or just all unused?
        // Safe approach: Delete unused.
        // const deleteExams = await prisma.exam.deleteMany({
        //     where: {
        //         questionExams: {
        //             none: {}
        //         }
        //     }
        // });
        // console.log(`🧹 Deleted ${deleteExams.count} unused exams.`);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        // Continue? Maybe safer to stop if cleanup fails to avoid duplicates if re-running.
        // But for now we proceed.
    }

    // 2. PARSE BATCH 2 FILE
    const batchFilePath = path.join(__dirname, '../questions_batch2_formatted_complete.txt');
    console.log(`📂 Reading batch file: ${batchFilePath}`);

    if (!fs.existsSync(batchFilePath)) {
        console.error('❌ Batch file not found!');
        return;
    }

    const fileContent = fs.readFileSync(batchFilePath, 'utf-8');
    const sections = fileContent.split('---').map(s => s.trim()).filter(s => s);

    // We expect sections. The file format seems to be Q blocks separated by ---
    // Let's refine parsing based on the file view I saw earlier.
    // The file has "### Q1. (SSC CHSL– Analogy)" format.

    // Regex for parsing
    // Header: ### Q(\d+)\. \((.*?)– (.*?)\)  -> captures Number, Exam, Topic
    // Question Text: (follows header)
    // Options: A. ... B. ...
    // Answer: **Answer:** ...
    // Explanation: **Explanation:** ...

    let successCount = 0;
    let errorCount = 0;

    // Helper to get or create Subject/Topic/Exam
    // Exams in file: SSC CHSL, RRB JE, UPSC CAPF, IBPS Clerk, SBI Clerk, RRB Group D, etc.
    // We need to map these to our Exam entities.

    const examMap = new Map(); // name -> id
    const subjectMap = new Map(); // name -> id
    const topicMap = new Map(); // slug -> id

    // Pre-fetch existing Exams to minimize DB calls
    const existingExams = await prisma.exam.findMany();
    existingExams.forEach(e => examMap.set(e.name.toLowerCase().trim(), e.id));
    existingExams.forEach(e => examMap.set(e.slug.toLowerCase().trim(), e.id)); // fallback

    // Pre-fetch Subjects
    const existingSubjects = await prisma.subject.findMany();
    existingSubjects.forEach(s => subjectMap.set(s.name.toLowerCase(), s.id));

    // Hardcoded Subject mapping based on file headers?
    // The file has "General Intelligence & Reasoning", "Quantitative Aptitude", etc. as Section headers?
    // Actually the file content snippet shows:
    // "## General Intelligence & Reasoning (50 questions)"
    // "### Q1. ..."
    // So we can track the current Subject context by looking for "## " lines.

    let currentSubjectId = null;

    for (const section of sections) {
        // Splits by '---' might splitting questions.
        // Let's iterate line by line instead for better state tracking.
    }

    // RE-STRATEGY FOR PARSING: Line-by-Line
    const lines = fileContent.split('\n');
    let currentQuestion = null;
    let currentSubjectName = "General Intelligence & Reasoning"; // Default start
    // Start with a valid subject ID if possible, or create on fly.

    // Ensure default subjects exist
    const defaultSubjects = [
        "General Intelligence & Reasoning",
        "General Awareness",
        "Quantitative Aptitude",
        "English Comprehension"
    ];

    for (const sub of defaultSubjects) {
        if (!subjectMap.has(sub.toLowerCase())) {
            const newSub = await prisma.subject.create({
                data: { name: sub, slug: sub.toLowerCase().replace(/[^a-z0-9]/g, '-') }
            });
            subjectMap.set(sub.toLowerCase(), newSub.id);
        }
    }

    currentSubjectId = subjectMap.get("General Intelligence & Reasoning".toLowerCase());

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 1. Detect Subject Header
        if (line.startsWith('## ')) {
            const subName = line.replace('## ', '').split('(')[0].trim();
            // Map to known subjects
            if (subjectMap.has(subName.toLowerCase())) {
                currentSubjectId = subjectMap.get(subName.toLowerCase());
                console.log(`📌 Switched Subject to: ${subName}`);
            }
            continue;
        }

        // 2. Detect Question Header
        // ### Q1. (SSC CHSL– Analogy)
        if (line.startsWith('### Q')) {
            // Save previous question if exists
            if (currentQuestion) {
                await saveQuestion(currentQuestion, examMap, topicMap, currentSubjectId);
                successCount++;
            }

            // Start new question
            // Regex to handle potential encoding issues with dashes (e.g. â€“)
            // Matches: ### Q1. (Exam Name [separator] Topic Name)
            let examName = "SSC CGL"; // Fallback
            let topicName = "General";

            // Just extract content between first pair of parens
            const innerContentMatch = line.match(/\((.*?)\)/);
            if (innerContentMatch) {
                const inner = innerContentMatch[1];
                // HEURISTIC PARSING via includes (Robust against Regex failures)
                const lineLower = line.toLowerCase();

                if (lineLower.includes('(ssc chsl')) {
                    examName = "SSC CHSL";
                    // Extract topic by splitting inner content
                    // Inner roughly: "SSC CHSLâ€“ Analogy"
                    // Split by known separators
                    const parts = inner.split(/(?:\u00e2\u20ac\u201c|\u2013|\u2014|â€“|-)/);
                    if (parts.length > 1) topicName = parts.slice(1).join(' ').trim();
                } else if (lineLower.includes('(rrb je')) {
                    examName = "RRB JE";
                    const parts = inner.split(/(?:\u00e2\u20ac\u201c|\u2013|\u2014|â€“|-)/);
                    if (parts.length > 1) topicName = parts.slice(1).join(' ').trim();
                } else if (lineLower.includes('(upsc capf')) {
                    examName = "UPSC CAPF";
                    const parts = inner.split(/(?:\u00e2\u20ac\u201c|\u2013|\u2014|â€“|-)/);
                    if (parts.length > 1) topicName = parts.slice(1).join(' ').trim();
                } else if (lineLower.includes('(ibps clerk')) {
                    examName = "IBPS Clerk";
                    const parts = inner.split(/(?:\u00e2\u20ac\u201c|\u2013|\u2014|â€“|-)/);
                    if (parts.length > 1) topicName = parts.slice(1).join(' ').trim();
                } else if (lineLower.includes('(sbi clerk')) {
                    examName = "SBI Clerk";
                    const parts = inner.split(/(?:\u00e2\u20ac\u201c|\u2013|\u2014|â€“|-)/);
                    if (parts.length > 1) topicName = parts.slice(1).join(' ').trim();
                } else {
                    // Fallback split
                    const parts = inner.split(/(?:\u00e2\u20ac\u201c|\u2013|\u2014|â€“|-)/);
                    if (parts.length >= 2) {
                        examName = parts[0].trim();
                        topicName = parts.slice(1).join(' ').trim();
                    } else {
                        console.log(`⚠️ Fallback parsing failed for: "${inner}"`);
                    }
                }
            } else {
                console.log(`⚠️ Match Failed for line: "${line}"`);
            }

            currentQuestion = {
                examName, // Raw exam string, might need splitting or mapping
                topicName,
                text: '',
                options: [],
                answer: '',
                explanation: '',
                subjectId: currentSubjectId
            };
            continue;
        }

        // 3. Capture Content
        if (currentQuestion) {
            if (line.startsWith('A.') || line.startsWith('(A)')) {
                currentQuestion.options.push({ id: 'A', text: line.replace(/^(A\.| \(A\)) /, '').trim() });
            } else if (line.startsWith('B.') || line.startsWith('(B)')) {
                currentQuestion.options.push({ id: 'B', text: line.replace(/^(B\.| \(B\)) /, '').trim() });
            } else if (line.startsWith('C.') || line.startsWith('(C)')) {
                currentQuestion.options.push({ id: 'C', text: line.replace(/^(C\.| \(C\)) /, '').trim() });
            } else if (line.startsWith('D.') || line.startsWith('(D)')) {
                currentQuestion.options.push({ id: 'D', text: line.replace(/^(D\.| \(D\)) /, '').trim() });
            } else if (line.startsWith('**Answer:**')) {
                // **Answer:** B. Heptagon
                const ansRaw = line.replace('**Answer:**', '').trim(); // "B. Heptagon"
                currentQuestion.answer = ansRaw.charAt(0); // "B"
            } else if (line.startsWith('**Explanation:**')) {
                currentQuestion.explanation = line.replace('**Explanation:**', '').trim();
            } else if (line.startsWith('---') || line.startsWith('===')) {
                // Separator, ignore
            } else {
                // Append to question text (if not options/answer/explanation)
                // Be careful not to append junk.
                // If we haven't seen options yet, it's question text.
                if (currentQuestion.options.length === 0) {
                    currentQuestion.text += (currentQuestion.text ? '\n' : '') + line;
                } else if (currentQuestion.answer && !currentQuestion.explanation) {
                    // Explanation might be multi-line? For now assume single line or started with **Explanation:**
                    // If it's effectively part of explanation but header missing?
                    // The format seems typically: Explanation: ...
                }
            }
        }
    }

    // Save last question
    if (currentQuestion) {
        await saveQuestion(currentQuestion, examMap, topicMap, currentSubjectId);
        successCount++;
    }

    console.log(`✨ Completed! Processed ${successCount} questions.`);
}

async function saveQuestion(q, examMap, topicMap, subjectId) {
    // 1. Resolve Exam
    // q.examName might be "SSC CHSL", "RRB JE", etc.
    // We want to link this question to that Exam.
    // Check if Exam exists, if not create?
    // Actually, for "Exam-Wise Filtering", we ideally want to map to broad categories or specific exams.
    // Let's normalize: 'SSC CHSL' -> check map. If missing, create.

    let examId = examMap.get(q.examName.toLowerCase());
    if (!examId) {
        // Create new Exam on the fly?
        // Slugify: SSC CHSL -> ssc-chsl
        const slug = q.examName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        try {
            const newExam = await prisma.exam.upsert({
                where: { slug: slug },
                update: {},
                create: {
                    name: q.examName,
                    slug: slug,
                    categoryId: (await getCategoryId()), // Need a default category
                    status: 'PUBLISHED'
                }
            });
            examId = newExam.id;
            examMap.set(q.examName.toLowerCase(), examId);
            console.log(`   ➕ Created/Found Exam: ${q.examName}`);
        } catch (e) {
            console.error(`   ⚠️ Failed to create exam ${q.examName}:`, e.message);
        }
    }

    // 2. Resolve Topic
    // Simple topic creation
    const topicSlug = q.topicName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let topicId = topicMap.get(topicSlug);
    if (!topicId && q.subjectId) {
        try {
            const topic = await prisma.topic.upsert({
                where: { subjectId_slug: { subjectId: q.subjectId, slug: topicSlug } },
                update: {},
                create: {
                    name: q.topicName,
                    slug: topicSlug,
                    subjectId: q.subjectId
                }
            });
            topicId = topic.id;
            topicMap.set(topicSlug, topicId);
        } catch (e) {
            // Ignore topic error
        }
    }

    // 3. Create Question
    try {
        const question = await prisma.question.create({
            data: {
                questionText: q.text,
                questionType: 'MCQ_SINGLE',
                options: q.options.map(o => ({ ...o, isCorrect: o.id === q.answer })),
                correctAnswer: q.answer, // 'A', 'B', etc.
                solution: q.explanation,
                subjectId: q.subjectId, // Required
                topicId: topicId || undefined,
                difficulty: 'MEDIUM',
                status: 'PUBLISHED',
                createdById: (await getAdminUserId()), // Need a user
                // questionExams: examId ? {
                //     create: { examId: examId }
                // } : undefined
            }
        });

        // Explicitly create relation
        if (examId) {
            await prisma.questionExam.create({
                data: {
                    questionId: question.id,
                    examId: examId
                }
            });
        }
        // console.log(`   Saved Question: ${q.text.substring(0, 30)}...`);
    } catch (e) {
        console.error(`   ❌ Failed to save question: ${q.text.substring(0, 20)}...`, e.message);
    }
}

let _adminUserId = null;
async function getAdminUserId() {
    if (_adminUserId) return _adminUserId;
    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (user) {
        _adminUserId = user.id;
        return user.id;
    }
    // Fallback: Use any user
    const anyUser = await prisma.user.findFirst();
    return anyUser ? anyUser.id : null;
}

let _defaultCategoryId = null;
async function getCategoryId() {
    if (_defaultCategoryId) return _defaultCategoryId;
    const cat = await prisma.examCategory.findFirst();
    if (cat) {
        _defaultCategoryId = cat.id;
        return cat.id;
    }
    // Create one
    const newCat = await prisma.examCategory.create({
        data: { name: 'General', slug: 'general' }
    });
    _defaultCategoryId = newCat.id;
    return newCat.id;
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
