
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function cleanupContent() {
    console.log('--- Cleaning Up Old Content ---');
    try {
        // Delete in reverse order of dependencies
        // 1. User Attempts
        await prisma.userTestAttempt.deleteMany({});
        console.log('Deleted UserTestAttempts');

        await prisma.userExamAttempt.deleteMany({});
        console.log('Deleted UserExamAttempts');

        // 2. Questions (need to handle TestQuestion linkages implicitly if cascade is on, but doing explicitly is safer)
        // Actually, prisma schema might not cascade everything.
        // Deleting Tests will delete TestQuestions if setup correctly

        // 3. Tests
        await prisma.test.deleteMany({});
        console.log('Deleted Tests');

        // 4. Questions (Clean orphan questions)
        await prisma.question.deleteMany({});
        console.log('Deleted Questions');

        // 5. Exams
        await prisma.exam.deleteMany({});
        console.log('Deleted Exams');

        // 6. Subjects (Categories)
        await prisma.subject.deleteMany({});
        console.log('Deleted Subjects/Categories');

        console.log('✅ Content Cleanup Complete');
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

async function seedContent() {
    console.log('--- Seeding New Content ---');

    // 1. Create Exam (SSC CGL)
    const exam = await prisma.exam.create({
        data: {
            title: 'SSC CGL Tier-I',
            slug: 'ssc-cgl-tier-1',
            description: 'Staff Selection Commission Combined Graduate Level Examination',
            price: 0,
            isFree: true,
            features: [
                'Latest Pattern',
                'Detailed Solutions',
                'All India Rank'
            ]
        }
    });
    console.log(`Created Exam: ${exam.title}`);

    // 2. Create Subjects
    console.log('Creating Subjects...');
    const subjectMap: Record<string, string> = {};
    const subjects = [
        'General Intelligence & Reasoning',
        'General Awareness',
        'Quantitative Aptitude',
        'English Comprehension'
    ];

    for (const sub of subjects) {
        const created = await prisma.subject.create({
            data: {
                name: sub,
                examId: exam.id
            }
        });
        subjectMap[sub] = created.id;
    }

    // 3. Create Test
    const test = await prisma.test.create({
        data: {
            title: 'SSC CGL Tier-I Full Mock Test 1',
            slug: 'ssc-cgl-mock-1',
            description: 'Full length mock test based on latest pattern',
            examId: exam.id,
            duration: 60, // mins
            totalMarks: 200,
            totalQuestions: 100,
            isFree: true,
            type: 'MOCK',
            difficulty: 'HARD',
            validUntil: new Date('2030-12-31')
        }
    });
    console.log(`Created Test: ${test.title}`);

    // 4. Parse & Upload Questions
    const rawContent = fs.readFileSync('raw_mock_test.txt', 'utf-8');

    // Simple parsing logic (robust enough for the structured format provided)
    // We split into two main parts: Questions 1-100, and Answer Key
    const sections = rawContent.split('ANSWER KEY WITH SOLUTIONS');
    const questionSection = sections[0];
    const answerSection = sections[1];

    // Helper to extract Questions
    const questions: any[] = [];

    // Regex strategy: Match "Question X: ..." blocks
    // Wait, the format in text file is:
    // "1. Select the related word: ..."
    // "Options:\n A) ... \n B) ..."

    // And Answer key:
    // "Question 1: ... \n Correct Answer: A) ... \n Detailed Solution: ..."

    // Let's iterate 1 to 100
    for (let i = 1; i <= 100; i++) {
        // Find Subject
        let subjectId = '';
        if (i <= 25) subjectId = subjectMap['General Intelligence & Reasoning'];
        else if (i <= 50) subjectId = subjectMap['General Awareness'];
        else if (i <= 75) subjectId = subjectMap['Quantitative Aptitude'];
        else subjectId = subjectMap['English Comprehension'];

        // Extract Question Text & Options
        // Look for pattern: "i. [Text]" until "Options:"
        const qRegex = new RegExp(`\\n${i}\\.\\s+([\\s\\S]*?)\\nOptions:`, 'i');
        const qMatch = questionSection.match(qRegex);

        // Options pattern
        const optRegex = new RegExp(`\\n${i}\\.[\\s\\S]*?Options:\\s+A\\)\\s+(.*?)\\s+B\\)\\s+(.*?)\\s+C\\)\\s+(.*?)\\s+D\\)\\s+(.*?)(?:\\n\\d+\\.|$)`, 'is');
        // Note: the end of options is either next number "5. " or end of section
        // We can be looser: just find A), B), C), D) after the question match

        // Let's use a simpler block parser. 
        // Find start index of "i. ", end index of "i+1. "
        const startMarker = `\n${i}. `;
        const endMarker = `\n${i + 1}. `;
        let qBlock = '';

        const startIdx = questionSection.indexOf(startMarker);
        if (startIdx === -1) {
            console.error(`Could not find Question ${i}`);
            continue;
        }

        let endIdx = questionSection.indexOf(endMarker, startIdx);
        // Handle last question or section breaks
        if (i === 25 || i === 50 || i === 75 || i === 100) {
            // Section break might interrupt "26. " immediately or not
            // The file has "SECTION X" headers between 25 and 26.
            // My indexOf search will find "26. " correctly even if there is a header in between.
            if (i === 100) endIdx = questionSection.length;
        }

        qBlock = questionSection.substring(startIdx, endIdx);

        // Extract Text
        // Remove "1. " and "Options:..."
        const textEnd = qBlock.indexOf('Options:');
        const text = qBlock.substring(0, textEnd).replace(/^\n\d+\.\s+/, '').trim();

        // Extract Options
        const optsBlock = qBlock.substring(textEnd);
        const optA = optsBlock.match(/A\)\s+(.*?)(\n|$|B\))/)?.[1].trim();
        const optB = optsBlock.match(/B\)\s+(.*?)(\n|$|C\))/)?.[1].trim();
        const optC = optsBlock.match(/C\)\s+(.*?)(\n|$|D\))/)?.[1].trim();
        const optD = optsBlock.match(/D\)\s+(.*?)(\n|$)/)?.[1].trim();

        // Extract Answer & Solution
        // Pattern: "Question i: ... Correct Answer: X) ... Detailed Solution: ..."
        const ansRegex = new RegExp(`Question ${i}:[\\s\\S]*?Correct Answer:\\s+([A-D])[\\s\\S]*?Detailed Solution:\\s+([\\s\\S]*?)(?:\\nQuestion|$)`, 'i');
        const ansMatch = answerSection.match(ansRegex);

        const correctOptLetter = ansMatch ? ansMatch[1] : 'A'; // Default to A if fail (shouldn't happen)
        const explanation = ansMatch ? ansMatch[2].trim() : '';

        // Map options array
        const options = [
            { text: optA || '', isCorrect: correctOptLetter === 'A' },
            { text: optB || '', isCorrect: correctOptLetter === 'B' },
            { text: optC || '', isCorrect: correctOptLetter === 'C' },
            { text: optD || '', isCorrect: correctOptLetter === 'D' },
        ];

        // Create Question in DB
        await prisma.question.create({
            data: {
                text: text,
                type: 'MCQ',
                difficulty: 'HARD',
                marks: 2,
                negativeMarks: 0.5,
                explanation: explanation,
                testId: test.id,
                subjectId: subjectId,
                options: {
                    create: options.map(o => ({
                        text: o.text,
                        isCorrect: o.isCorrect
                    }))
                }
            }
        });

        if (i % 10 === 0) console.log(`Processed ${i}/100 questions...`);
    }

    console.log('✅ All 100 Questions Uploaded Successfully');
}

async function main() {
    await cleanupContent();
    await seedContent();
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
