
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function cleanupContent() {
    console.log('--- Cleaning Up Old Content ---');
    try {
        await prisma.attemptAnswer.deleteMany({});
        console.log('Deleted AttemptAnswers');
        await prisma.testAttempt.deleteMany({});
        console.log('Deleted TestAttempts');
        await prisma.testQuestion.deleteMany({});
        console.log('Deleted TestQuestions');
        await prisma.mockTest.deleteMany({});
        console.log('Deleted MockTests');
        await prisma.questionExam.deleteMany({});
        await prisma.question.deleteMany({});
        console.log('Deleted Questions');
        await prisma.section.deleteMany({});
        await prisma.exam.deleteMany({});
        console.log('Deleted Exams');
        await prisma.examCategory.deleteMany({});
        console.log('Deleted ExamCategories');
        await prisma.book.deleteMany({});
        await prisma.topic.deleteMany({});
        await prisma.subject.deleteMany({});
        console.log('Deleted Subjects/Topics/Books');
        console.log('✅ Content Cleanup Complete');
    } catch (error) {
        console.error('Error during cleanup:', error);
    }
}

// Parse all answers into a map: { 1: { correct: 'A', solution: '...' }, 2: {...}, ... }
function parseAnswerKey(answerSection) {
    const answerMap = {};

    // Split by "Question N:" pattern - use regex to find all question blocks
    // We'll find all occurrences of "Question <number>:" and extract the content between them
    const questionBlockRegex = /Question (\d+):\s*([^\n]*)\n([\s\S]*?)(?=Question \d+:|$)/g;

    let match;
    while ((match = questionBlockRegex.exec(answerSection)) !== null) {
        const qNum = parseInt(match[1], 10);
        const questionText = match[2].trim(); // The question text after "Question N:"
        const blockContent = match[3];

        // Extract correct answer: "Correct Answer: A) ..."
        const correctMatch = blockContent.match(/Correct Answer:\s*([A-D])\)/i);
        const correctLetter = correctMatch ? correctMatch[1].toUpperCase() : 'A';

        // Extract solution: "Detailed Solution:\n..."
        const solutionMatch = blockContent.match(/Detailed Solution:\s*([\s\S]*?)(?=\n\n|$)/i);
        const solution = solutionMatch ? solutionMatch[1].trim() : '';

        answerMap[qNum] = {
            correct: correctLetter,
            solution: solution
        };
    }

    return answerMap;
}

// Parse all questions into an array
function parseQuestions(questionSection) {
    const questions = [];

    // Find each question block: "N. <text>\n\nOptions:\nA) ...\nB) ...\nC) ...\nD) ..."
    for (let i = 1; i <= 100; i++) {
        // Find this question's block
        const startPattern = new RegExp(`\\n${i}\\. `);
        const startMatch = questionSection.match(startPattern);

        if (!startMatch) {
            console.error(`Could not find Question ${i} in questions section`);
            questions.push({ num: i, text: '', options: { A: '', B: '', C: '', D: '' } });
            continue;
        }

        const startIdx = startMatch.index;

        // Find end: either next question number or section header or end
        let endIdx;
        if (i < 100) {
            const endPattern = new RegExp(`\\n${i + 1}\\. `);
            const restOfSection = questionSection.substring(startIdx + 1);
            const endMatch = restOfSection.match(endPattern);
            if (endMatch) {
                endIdx = startIdx + 1 + endMatch.index;
            } else {
                // Maybe section break
                const sectionMatch = restOfSection.match(/\n={5,}/);
                if (sectionMatch) {
                    endIdx = startIdx + 1 + sectionMatch.index;
                } else {
                    endIdx = questionSection.length;
                }
            }
        } else {
            endIdx = questionSection.length;
        }

        const block = questionSection.substring(startIdx, endIdx);

        // Extract question text (before "Options:")
        const optionsIdx = block.indexOf('Options:');
        const rawText = optionsIdx !== -1
            ? block.substring(0, optionsIdx)
            : block;

        // Clean up the question text (remove leading "N. ")
        const text = rawText.replace(/^\n?\d+\.\s*/, '').trim();

        // Extract options
        const optionsBlock = optionsIdx !== -1 ? block.substring(optionsIdx) : '';
        const lines = optionsBlock.split('\n').map(l => l.trim());

        const options = { A: '', B: '', C: '', D: '' };
        for (const line of lines) {
            if (line.startsWith('A)')) options.A = line.substring(2).trim();
            else if (line.startsWith('B)')) options.B = line.substring(2).trim();
            else if (line.startsWith('C)')) options.C = line.substring(2).trim();
            else if (line.startsWith('D)')) options.D = line.substring(2).trim();
        }

        questions.push({ num: i, text, options });
    }

    return questions;
}

async function seedContent() {
    console.log('--- Seeding New Content ---');

    // 1. Create Exam Category
    const category = await prisma.examCategory.create({
        data: {
            name: 'SSC Exams',
            slug: 'ssc',
            description: 'Staff Selection Commission Exams'
        }
    });

    // 2. Create Exam
    const exam = await prisma.exam.create({
        data: {
            name: 'SSC CGL Tier-I',
            slug: 'ssc-cgl-tier-1',
            description: 'Staff Selection Commission Combined Graduate Level Examination',
            categoryId: category.id,
            status: 'PUBLISHED'
        }
    });
    console.log(`Created Exam: ${exam.name}`);

    // 3. Create Subjects
    const subjectMap = {};
    const subjects = [
        'General Intelligence & Reasoning',
        'General Awareness',
        'Quantitative Aptitude',
        'English Comprehension'
    ];
    for (const sub of subjects) {
        const slug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const created = await prisma.subject.create({ data: { name: sub, slug } });
        subjectMap[sub] = created.id;
    }

    // 4. Create Mock Test
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) throw new Error('No admin user found');

    const test = await prisma.mockTest.create({
        data: {
            name: 'SSC CGL Tier-I Full Mock Test 1',
            slug: 'ssc-cgl-mock-1',
            description: 'Full length mock test based on latest pattern',
            examId: exam.id,
            durationMinutes: 60,
            totalMarks: 200,
            totalQuestions: 100,
            accessType: 'FREE',
            testType: 'FULL_LENGTH',
            negativeMarking: 0.50,
            status: 'PUBLISHED',
            createdById: adminUser.id
        }
    });
    console.log(`Created Test: ${test.name}`);

    // 5. Parse content
    const rawContent = fs.readFileSync('raw_mock_test.txt', 'utf-8');
    const parts = rawContent.split('ANSWER KEY WITH SOLUTIONS');
    let questionSection = parts[0];
    const answerSection = parts[1];

    // Strip instructions (before Section 1)
    const section1Idx = questionSection.indexOf('SECTION 1:');
    if (section1Idx !== -1) {
        questionSection = questionSection.substring(section1Idx);
    }

    // Parse
    const questions = parseQuestions(questionSection);
    const answerMap = parseAnswerKey(answerSection);

    console.log(`Parsed ${questions.length} questions and ${Object.keys(answerMap).length} answers`);

    // Validate parsing
    for (let i = 1; i <= 100; i++) {
        if (!answerMap[i]) {
            console.warn(`Warning: No answer found for Question ${i}`);
        }
    }

    // 6. Insert questions
    for (const q of questions) {
        const i = q.num;

        // Determine subject
        let subjectId;
        if (i <= 25) subjectId = subjectMap['General Intelligence & Reasoning'];
        else if (i <= 50) subjectId = subjectMap['General Awareness'];
        else if (i <= 75) subjectId = subjectMap['Quantitative Aptitude'];
        else subjectId = subjectMap['English Comprehension'];

        const answer = answerMap[i] || { correct: 'A', solution: '' };

        const options = [
            { id: 'A', text: q.options.A, isCorrect: answer.correct === 'A' },
            { id: 'B', text: q.options.B, isCorrect: answer.correct === 'B' },
            { id: 'C', text: q.options.C, isCorrect: answer.correct === 'C' },
            { id: 'D', text: q.options.D, isCorrect: answer.correct === 'D' },
        ];

        const createdQ = await prisma.question.create({
            data: {
                questionText: q.text,
                questionType: 'MCQ_SINGLE',
                difficulty: 'HARD',
                options: options,
                correctAnswer: answer.correct,
                solution: answer.solution || null,
                subjectId: subjectId,
                status: 'PUBLISHED',
                createdById: adminUser.id
            }
        });

        await prisma.testQuestion.create({
            data: {
                testId: test.id,
                questionId: createdQ.id,
                questionOrder: i,
                marks: 2.0
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
