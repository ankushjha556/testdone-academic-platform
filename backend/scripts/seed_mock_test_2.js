const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

// Parse all answers into a map
function parseAnswerKey(answerSection) {
    const answerMap = {};

    // Simple line-by-line parsing for "Q1 B" format
    const lines = answerSection.split('\n');
    for (const line of lines) {
        const match = line.trim().match(/^Q(\d+)\s+([A-D])$/i);
        if (match) {
            const qNum = parseInt(match[1], 10);
            answerMap[qNum] = { correct: match[2].toUpperCase(), solution: '' };
        }
    }

    // Now parse solutions
    const solutionRegex = /SOLUTION Q(\d+):\s*([\s\S]*?)(?=SOLUTION Q\d+:|$)/gi;
    let solutionMatch;
    while ((solutionMatch = solutionRegex.exec(answerSection)) !== null) {
        const qNum = parseInt(solutionMatch[1], 10);
        const solution = solutionMatch[2].trim().replace(/Answer:\s*\([A-D]\)\s*\S+/gi, '').trim();
        if (answerMap[qNum]) {
            answerMap[qNum].solution = solution;
        } else {
            answerMap[qNum] = { correct: 'A', solution };
        }
    }

    return answerMap;
}

// Parse all questions into an array
function parseQuestions(questionSection) {
    const questions = [];

    for (let i = 1; i <= 100; i++) {
        // Find this question's block using "Q{i}." pattern
        const startPattern = new RegExp(`\\nQ${i}\\.\\s`);
        const startMatch = questionSection.match(startPattern);

        if (!startMatch) {
            console.error(`Could not find Question ${i}`);
            questions.push({ num: i, text: '', options: { A: '', B: '', C: '', D: '' } });
            continue;
        }

        const startIdx = startMatch.index;

        // Find end: next question or section
        let endIdx;
        if (i < 100) {
            const endPattern = new RegExp(`\\nQ${i + 1}\\.\\s`);
            const restOfSection = questionSection.substring(startIdx + 1);
            const endMatch = restOfSection.match(endPattern);
            if (endMatch) {
                endIdx = startIdx + 1 + endMatch.index;
            } else {
                const sectionMatch = restOfSection.match(/\n={5,}/);
                endIdx = sectionMatch ? startIdx + 1 + sectionMatch.index : questionSection.length;
            }
        } else {
            endIdx = questionSection.length;
        }

        const block = questionSection.substring(startIdx, endIdx);

        // Extract question text (before first option)
        const optionAIdx = block.indexOf('(A)');
        const rawText = optionAIdx !== -1 ? block.substring(0, optionAIdx) : block;
        const text = rawText.replace(/^\nQ\d+\.\s*/, '').trim();

        // Extract options
        const options = { A: '', B: '', C: '', D: '' };
        const optAMatch = block.match(/\(A\)\s*(.*?)(?=\(B\)|$)/s);
        const optBMatch = block.match(/\(B\)\s*(.*?)(?=\(C\)|$)/s);
        const optCMatch = block.match(/\(C\)\s*(.*?)(?=\(D\)|$)/s);
        const optDMatch = block.match(/\(D\)\s*(.*?)(?=\n\n|\nQ\d+|$)/s);

        if (optAMatch) options.A = optAMatch[1].trim();
        if (optBMatch) options.B = optBMatch[1].trim();
        if (optCMatch) options.C = optCMatch[1].trim();
        if (optDMatch) options.D = optDMatch[1].trim();

        questions.push({ num: i, text, options });
    }

    return questions;
}

async function seedMockTest2() {
    console.log('--- Adding Mock Test 2 ---');

    // 1. Find existing exam
    let exam = await prisma.exam.findFirst({
        where: { slug: 'ssc-cgl-tier-1' }
    });

    if (!exam) {
        console.log('Exam not found, creating...');
        let category = await prisma.examCategory.findFirst({ where: { slug: 'ssc' } });
        if (!category) {
            category = await prisma.examCategory.create({
                data: { name: 'SSC Exams', slug: 'ssc', description: 'Staff Selection Commission Exams' }
            });
        }
        exam = await prisma.exam.create({
            data: {
                name: 'SSC CGL Tier-I',
                slug: 'ssc-cgl-tier-1',
                description: 'Staff Selection Commission Combined Graduate Level Examination',
                categoryId: category.id,
                status: 'PUBLISHED'
            }
        });
    }
    console.log(`Using Exam: ${exam.name}`);

    // 2. Find or create subjects
    const subjectMap = {};
    const subjects = [
        'General Intelligence & Reasoning',
        'General Awareness',
        'Quantitative Aptitude',
        'English Comprehension'
    ];
    for (const sub of subjects) {
        const slug = sub.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        let existing = await prisma.subject.findFirst({ where: { slug } });
        if (!existing) {
            existing = await prisma.subject.create({ data: { name: sub, slug } });
        }
        subjectMap[sub] = existing.id;
    }

    // 3. Get admin user
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) throw new Error('No admin user found');

    // 4. Check if Mock Test 2 already exists, delete if so
    const existingTest = await prisma.mockTest.findFirst({ where: { slug: 'ssc-cgl-mock-2' } });
    if (existingTest) {
        console.log('Mock Test 2 already exists, deleting old version...');
        await prisma.testQuestion.deleteMany({ where: { testId: existingTest.id } });
        await prisma.attemptAnswer.deleteMany({ where: { attempt: { testId: existingTest.id } } });
        await prisma.testAttempt.deleteMany({ where: { testId: existingTest.id } });
        await prisma.mockTest.delete({ where: { id: existingTest.id } });
    }

    // 5. Create Mock Test 2
    const test = await prisma.mockTest.create({
        data: {
            name: 'SSC CGL Tier-I Full Mock Test 2',
            slug: 'ssc-cgl-mock-2',
            description: 'Full length mock test based on latest pattern - Moderate to Difficult',
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

    // 6. Parse content
    const rawContent = fs.readFileSync('raw_mock_test_2.txt', 'utf-8');
    const answerKeyIdx = rawContent.indexOf('ANSWER KEY');
    let questionSection = rawContent.substring(0, answerKeyIdx);
    const answerSection = rawContent.substring(answerKeyIdx);

    // Strip instructions
    const section1Idx = questionSection.indexOf('SECTION 1:');
    if (section1Idx !== -1) {
        questionSection = questionSection.substring(section1Idx);
    }

    const questions = parseQuestions(questionSection);
    const answerMap = parseAnswerKey(answerSection);

    console.log(`Parsed ${questions.length} questions and ${Object.keys(answerMap).length} answers`);

    // 7. Insert questions
    for (const q of questions) {
        const i = q.num;

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

    console.log('✅ Mock Test 2 Added Successfully');
}

seedMockTest2()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
