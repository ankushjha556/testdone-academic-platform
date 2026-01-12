
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Question Import...');

    // 1. Read Chunks - Including both original batch and new batch
    const chunkFiles = [
        // Original Batch 1 (Q1-Q212)
        'questions_raw.txt',
        'questions_chunk2.txt',
        'questions_chunk3.txt',
        'questions_chunk4.txt',
        // New Batch 2 - Complete formatted file (Q1-Q100 from batch2)
        'questions_batch2_formatted_complete.txt'
    ];

    let fullText = '';
    for (const file of chunkFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            fullText += fs.readFileSync(filePath, 'utf-8') + '\n';
            console.log(`Loaded ${file}`);
        } else {
            console.warn(`Warning: ${file} not found.`);
        }
    }

    // 2. DISABLED: Clear Old "Question Bank" Questions (Not linked to Tests)
    // SAFETY: Disabled to preserve existing 221 questions while adding new batch2 questions
    console.log('Skipping deletion - preserving existing questions...');
    /*
    const deleted = await prisma.question.deleteMany({
        where: {
            testQuestions: {
                none: {}
            }
        }
    });
    console.log(`Deleted ${deleted.count} old practice questions.`);
    */

    // 3. Ensure Default Content Creator
    let admin = await prisma.user.findFirst({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    if (!admin) {
        console.log('No admin found, creating seed admin...');
        // Create or find a dummy user if absolutely needed, but usually admin exists
        // For safety, let's just pick array[0] if exists
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
            admin = anyUser;
        } else {
            // Create one
            admin = await prisma.user.create({
                data: {
                    email: 'admin@testdone.in',
                    firstName: 'Admin',
                    role: 'ADMIN',
                    passwordHash: 'dummy'
                }
            });
            console.log('Created new Admin user: admin@testdone.in');
        }
    }

    if (!admin) {
        throw new Error("No user found to assign questions to.");
    }

    // 4. Upsert Subjects
    // Mapping of text identifiers to Subject Slugs/Names
    const subjectMap = {
        'Reasoning Ability': { name: 'Reasoning Ability', slug: 'reasoning' },
        'Reasoning': { name: 'Reasoning Ability', slug: 'reasoning' },
        'General Awareness': { name: 'General Awareness', slug: 'general-awareness' },
        'Quantitative Aptitude': { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude' },
        'Mathematics': { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude' }, // Map Math to Quant
        'Arithmetic': { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude' },
        'English Language': { name: 'English Language', slug: 'english' },
        'English': { name: 'English Language', slug: 'english' },
    };

    // Specific topic mapping fallback
    const topicToSubjectMap: Record<string, string> = {
        'History': 'General Awareness',
        'Polity': 'General Awareness',
        'Geography': 'General Awareness',
        'Economy': 'General Awareness',
        'Economics': 'General Awareness',
        'General Science': 'General Awareness',
        'Biology': 'General Awareness',
        'Physics': 'General Awareness',
        'Chemistry': 'General Awareness',
        'Static GK': 'General Awareness',
        'Current Affairs': 'General Awareness',
        'Computer Awareness': 'General Awareness',
        'Environment': 'General Awareness',
        'Ecology': 'General Awareness',
        'Art & Architecture': 'General Awareness',
        'Culture': 'General Awareness',
        'Psychology': 'General Awareness', // Fallback
        'Sociology': 'General Awareness',
        'Philosophy': 'General Awareness',
        'Education': 'General Awareness',
        'Finance': 'General Awareness',
        'Banking Awareness': 'General Awareness',
        'International Relations': 'General Awareness',
        'Geology': 'General Awareness',
        'Science & Tech': 'General Awareness'
    };

    const createdSubjects: Record<string, string> = {}; // Name -> ID

    // Pre-create known subjects
    const distinctSubjects = Object.values(subjectMap).map(s => s.name);
    // Unique names
    const uniqueSubjectNames = [...new Set(distinctSubjects)];

    for (const name of uniqueSubjectNames) {
        // Find config associated
        const key = Object.keys(subjectMap).find(k => subjectMap[k].name === name);
        const config = subjectMap[key!];

        const sub = await prisma.subject.upsert({
            where: { slug: config.slug },
            update: {},
            create: { name: config.name, slug: config.slug }
        });
        createdSubjects[config.name] = sub.id;
    }

    // 5. Upsert Exam Category (Generic)
    const category = await prisma.examCategory.upsert({
        where: { slug: 'government-exams' },
        update: {},
        create: { name: 'Government Exams', slug: 'government-exams' }
    });

    // Cache for Exams: Name -> ID
    const examCache: Record<string, string> = {};

    // 6. Parse and Insert
    // Split by "### Q"
    const fragments = fullText.split('### Q');
    let currentHeaderSubject = 'General Awareness'; // Default if no header found

    console.log(`Found ${fragments.length - 1} potential questions.`);

    let count = 0;

    for (let i = 1; i < fragments.length; i++) {
        const block = fragments[i].trim();
        if (!block) continue;

        // Structure: Number. (Exams - Topic)\nQuestion Text\nA.\nB.\n...\n**Answer:** X\n**Solution:** Text

        // Parse First Line: "1. (SSC CGL / RRB NTPC – Coding–Decoding)"
        const firstLineEnd = block.indexOf('\n');
        const firstLine = block.substring(0, firstLineEnd).trim();

        // Extract Metadata
        // Regex for: Digits. ( ... )
        const metaMatch = firstLine.match(/^(\d+)\.\s*\((.*?)\)$/);
        if (!metaMatch) {
            console.log(`Skipping block ${i}: Invalid header format: ${firstLine}`);
            continue;
        }

        const qNum = metaMatch[1];
        const context = metaMatch[2]; // "SSC CGL / RRB NTPC – Coding–Decoding"

        // Parse Context
        // Split by Dash
        let separator = '–'; // En-dash
        if (!context.includes('–')) separator = '-'; // Hyphen

        let parts = context.split(separator).map(s => s.trim());

        let examsPart = parts[0];
        let topicPart = parts.length > 1 ? parts[1] : '';

        // If context is just "UPSC / CDS - Mathematics", topic is Mathematics.
        // If context is just "SSC CGL / RRB NTPC - Reasoning - Analogy", Topic is Reasoning / Analogy.

        // Determine Subject
        let subjectId = createdSubjects['General Awareness']; // Default

        // Check main headers in text? (The "## Reasoning Ability" earlier)
        // Actually, we can infer subject from Topic Part most of the time

        if (topicPart) {
            if (Object.keys(subjectMap).some(k => topicPart.includes(k))) {
                const match = Object.keys(subjectMap).find(k => topicPart.includes(k));
                if (match) subjectId = createdSubjects[subjectMap[match].name];
            } else if (Object.keys(topicToSubjectMap).some(k => topicPart.includes(k))) {
                const match = Object.keys(topicToSubjectMap).find(k => topicPart.includes(k));
                if (match) subjectId = createdSubjects[topicToSubjectMap[match]];
            }
        }

        // Fallback: Check if examsPart indicates subject? (Rare)

        // Parse Question Text
        // Lines between first line and "A."
        const lines = block.split('\n');
        let qTextLines = [];
        let optionStartIndex = -1;

        for (let j = 1; j < lines.length; j++) {
            const line = lines[j].trim();
            if (line.match(/^[A-D]\.\s/)) {
                optionStartIndex = j;
                break;
            }
            if (line) qTextLines.push(line);
        }

        const questionText = qTextLines.join('\n').trim();

        // Parse Options
        const options = [];
        let answerChar = '';
        let solutionText = '';

        // Find Answer and Solution lines
        let answerLineIndex = -1;
        let solutionLineIndex = -1;

        for (let j = optionStartIndex; j < lines.length; j++) {
            const line = lines[j].trim();
            if (line.startsWith('**Answer:**')) {
                answerLineIndex = j;
                const m = line.match(/\*\*Answer:\*\*\s*(.*)/);
                if (m) {
                    // Sometimes answer is "A" or "A (Text)"
                    // We just want the char
                    answerChar = m[1].trim().charAt(0);
                }
            }
            if (line.startsWith('**Solution:**')) {
                solutionLineIndex = j;
            }
        }

        if (answerLineIndex === -1 && solutionLineIndex === -1) {
            console.log(`Skipping Q${qNum}: No Answer/Solution found.`);
            continue;
        }

        // Extract Options
        if (optionStartIndex > -1) {
            // Collect lines from optionStartIndex to AnswerLineIndex (exclusive)
            let limit = answerLineIndex > -1 ? answerLineIndex : lines.length;
            for (let j = optionStartIndex; j < limit; j++) {
                const line = lines[j].trim();
                const optMatch = line.match(/^([A-D])\.\s+(.*)/);
                if (optMatch) {
                    options.push({
                        id: optMatch[1],
                        text: optMatch[2],
                        isCorrect: optMatch[1] === answerChar
                    });
                } else {
                    // Multiline option? Append to previous?
                    if (options.length > 0 && line) {
                        options[options.length - 1].text += " " + line;
                    }
                }
            }
        }

        // Extract Solution
        if (solutionLineIndex > -1) {
            let solLines = [];
            solLines.push(lines[solutionLineIndex].replace('**Solution:**', '').trim());
            for (let j = solutionLineIndex + 1; j < lines.length; j++) {
                solLines.push(lines[j]);
            }
            solutionText = solLines.join('\n').trim();
        }

        // Identify Exams
        const examNames = examsPart.split('/').map(s => s.trim());
        const examIds = [];

        for (const en of examNames) {
            let eName = en.replace('Exams', '').trim();
            if (!eName) continue;

            if (!examCache[eName]) {
                // Upsert Exam
                // Slugify
                const slug = eName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                const ex = await prisma.exam.upsert({
                    where: { slug },
                    update: {},
                    create: {
                        name: eName,
                        slug,
                        categoryId: category.id,
                        description: `Practice questions for ${eName}`
                    }
                });
                examCache[eName] = ex.id;
            }
            examIds.push(examCache[eName]);
        }

        // Validations
        if (!questionText || options.length < 2 || !answerChar) {
            console.log(`Skipping Q${qNum}: Incomplete data.`);
            continue;
        }

        // Create Question
        try {
            await prisma.question.create({
                data: {
                    questionText,
                    difficulty: 'MEDIUM', // Default
                    questionType: 'MCQ_SINGLE', // Assuming single choice
                    options: options as any, // JSON array
                    correctAnswer: answerChar,
                    solution: solutionText,
                    subject: { connect: { id: subjectId } },
                    createdBy: { connect: { id: admin.id } },
                    source: 'PREVIOUS_YEAR',
                    questionExams: {
                        create: examIds.map(eid => ({
                            exam: { connect: { id: eid } }
                        }))
                    }
                } as any
            });
            count++;
        } catch (e) {
            console.error(`Failed to create Q${qNum}:`, e);
        }
    }

    console.log(`Import Completed. Imported ${count} questions.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
