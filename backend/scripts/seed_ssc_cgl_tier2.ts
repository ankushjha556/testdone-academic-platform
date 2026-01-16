/**
 * SSC CGL Tier-2 Premium Mock Tests Seeder V3
 * 
 * FIXES:
 * - Option A parsing bug fixed
 * - Proper line-by-line parsing
 * - Passage handling for comprehension questions
 * 
 * Settings:
 * - Duration: 180 minutes (combined timer)
 * - Marking: +1 correct, -0.25 wrong, 0 unattempted
 * - Access: PREMIUM (login required)
 * - Sections: 4 sections with free navigation
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Section definitions for SSC CGL Tier-2
const SECTIONS = [
    {
        name: 'Mathematical Abilities',
        startQ: 1,
        endQ: 30,
        order: 0,
        subjectName: 'Quantitative Aptitude'
    },
    {
        name: 'Reasoning & General Intelligence',
        startQ: 31,
        endQ: 60,
        order: 1,
        subjectName: 'Reasoning'
    },
    {
        name: 'English Language & Comprehension',
        startQ: 61,
        endQ: 105,
        order: 2,
        subjectName: 'English Language'
    },
    {
        name: 'General Awareness',
        startQ: 106,
        endQ: 130,
        order: 3,
        subjectName: 'General Awareness'
    }
];

interface ParsedQuestion {
    questionNumber: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    solution: string;
    sectionIndex: number;
    subjectName: string;
    passage?: string;
}

interface ParsedMock {
    questions: ParsedQuestion[];
    title: string;
}

/**
 * Parse a mock test file with proper line-by-line parsing
 */
function parseMockFile(filePath: string, mockNumber: number): ParsedMock {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').map(line => line.trimEnd()); // Keep leading spaces, trim trailing

    const questions: ParsedQuestion[] = [];

    // Find key sections
    let answerKeyStartLine = -1;
    let solutionsStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed === 'ANSWER KEY') {
            answerKeyStartLine = i;
        }
        if (trimmed === 'DETAILED SOLUTIONS') {
            solutionsStartLine = i;
        }
    }

    if (answerKeyStartLine === -1) {
        throw new Error(`ANSWER KEY not found in ${filePath}`);
    }

    console.log(`  Found ANSWER KEY at line ${answerKeyStartLine}`);

    // Parse answer key
    const answerMap: Record<number, string> = {};
    const answerEndLine = solutionsStartLine > -1 ? solutionsStartLine : lines.length;

    for (let i = answerKeyStartLine + 1; i < answerEndLine; i++) {
        const line = lines[i].trim();
        // Match patterns like "Q1: b" or "Q1: a"
        const match = line.match(/^Q(\d+):\s*([a-dA-D])$/);
        if (match) {
            answerMap[parseInt(match[1])] = match[2].toLowerCase();
        }
    }

    console.log(`  Parsed ${Object.keys(answerMap).length} answers`);

    // Parse solutions
    const solutionMap: Record<number, string> = {};
    if (solutionsStartLine > -1) {
        let currentQ = 0;
        let currentSolution: string[] = [];

        for (let i = solutionsStartLine + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            const qMatch = line.match(/^Q(\d+):\s*(.*)$/);

            if (qMatch) {
                // Save previous solution
                if (currentQ > 0 && currentSolution.length > 0) {
                    solutionMap[currentQ] = currentSolution.join(' ').trim();
                }
                currentQ = parseInt(qMatch[1]);
                currentSolution = qMatch[2] ? [qMatch[2]] : [];
            } else if (currentQ > 0 && line) {
                currentSolution.push(line);
            }
        }
        // Save last solution
        if (currentQ > 0 && currentSolution.length > 0) {
            solutionMap[currentQ] = currentSolution.join(' ').trim();
        }
    }

    console.log(`  Parsed ${Object.keys(solutionMap).length} solutions`);

    // Now parse questions
    let currentPassage: string | null = null;
    let i = 0;

    while (i < answerKeyStartLine) {
        const line = lines[i].trim();

        // Skip empty lines and section headers
        if (!line || line.startsWith('SECTION ') || line.startsWith('SSC CGL')) {
            i++;
            continue;
        }

        // Check for passage (comprehension)
        if (line.startsWith('Passage:') || line.startsWith('Directions:') || line.startsWith('Direction:')) {
            // Collect the entire passage
            let passageLines = [line];
            i++;

            // Continue until we hit a question
            while (i < answerKeyStartLine) {
                const nextLine = lines[i].trim();
                if (nextLine.match(/^Q\d+\./)) {
                    break; // Hit a question
                }
                if (nextLine) {
                    passageLines.push(nextLine);
                }
                i++;
            }
            currentPassage = passageLines.join(' ').trim();
            console.log(`  Found passage: "${currentPassage.substring(0, 50)}..."`);
            continue; // Don't increment i again, we're at the question
        }

        // Check for question start
        const qMatch = line.match(/^Q(\d+)\.\s*(.*)/);
        if (qMatch) {
            const qNum = parseInt(qMatch[1]);
            let questionTextParts: string[] = [];

            // Get the question text (everything after "Q1.")
            if (qMatch[2]) {
                questionTextParts.push(qMatch[2]);
            }

            i++;

            // Continue collecting question text until we hit option (a)
            while (i < answerKeyStartLine) {
                const nextLine = lines[i].trim();

                if (nextLine.match(/^\(a\)/i)) {
                    break; // Hit option A
                }
                if (nextLine.match(/^Q\d+\./)) {
                    // Hit next question without options - error case
                    console.warn(`  Warning: Q${qNum} missing options, skipping`);
                    i--;
                    break;
                }
                if (nextLine) {
                    questionTextParts.push(nextLine);
                }
                i++;
            }

            const questionText = questionTextParts.join(' ').trim();

            // Now parse options - they should be on separate lines
            let optionA = '', optionB = '', optionC = '', optionD = '';

            // Parse option A
            if (i < answerKeyStartLine) {
                const lineA = lines[i].trim();
                const matchA = lineA.match(/^\(a\)\s*(.*)/i);
                if (matchA) {
                    optionA = matchA[1].trim();
                }
                i++;
            }

            // Parse option B
            if (i < answerKeyStartLine) {
                const lineB = lines[i].trim();
                const matchB = lineB.match(/^\(b\)\s*(.*)/i);
                if (matchB) {
                    optionB = matchB[1].trim();
                }
                i++;
            }

            // Parse option C
            if (i < answerKeyStartLine) {
                const lineC = lines[i].trim();
                const matchC = lineC.match(/^\(c\)\s*(.*)/i);
                if (matchC) {
                    optionC = matchC[1].trim();
                }
                i++;
            }

            // Parse option D
            if (i < answerKeyStartLine) {
                const lineD = lines[i].trim();
                const matchD = lineD.match(/^\(d\)\s*(.*)/i);
                if (matchD) {
                    optionD = matchD[1].trim();
                }
                i++;
            }

            // Determine section
            const section = SECTIONS.find(s => qNum >= s.startQ && qNum <= s.endQ);
            if (!section) {
                console.error(`  Q${qNum} doesn't belong to any section!`);
                continue;
            }

            // Clear passage for non-English sections
            if (qNum < 61 || qNum > 105) {
                currentPassage = null;
            }

            const correctKey = answerMap[qNum] || 'a';

            questions.push({
                questionNumber: qNum,
                questionText,
                optionA,
                optionB,
                optionC,
                optionD,
                correctAnswer: correctKey.toUpperCase(),
                solution: solutionMap[qNum] || '',
                sectionIndex: section.order,
                subjectName: section.subjectName,
                passage: currentPassage || undefined
            });

            continue; // Already incremented i
        }

        i++;
    }

    // Sort by question number
    questions.sort((a, b) => a.questionNumber - b.questionNumber);

    console.log(`\n  Total questions parsed: ${questions.length}`);

    // Validate options
    let missingOptions = 0;
    for (const q of questions) {
        if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
            console.warn(`  Q${q.questionNumber} has missing options: A="${q.optionA}" B="${q.optionB}" C="${q.optionC}" D="${q.optionD}"`);
            missingOptions++;
        }
    }

    if (missingOptions > 0) {
        console.warn(`  ⚠️ ${missingOptions} questions have missing options`);
    }

    // Check section distribution
    const sectionCounts = [0, 0, 0, 0];
    questions.forEach(q => sectionCounts[q.sectionIndex]++);
    console.log(`  Section distribution: ${sectionCounts.join(', ')} (expected: 30, 30, 45, 25)`);

    // Count passages
    const passageQuestions = questions.filter(q => q.passage).length;
    console.log(`  Questions with passages: ${passageQuestions}`);

    return {
        questions,
        title: `SSC CGL Tier-II Mock Test ${mockNumber}`
    };
}

/**
 * Delete existing Tier-2 mocks and their questions
 */
async function cleanupExistingMocks() {
    console.log('\n[0/5] Cleaning up existing Tier-2 mocks...');

    const exam = await prisma.exam.findUnique({
        where: { slug: 'ssc-cgl-tier-2' }
    });

    if (!exam) {
        console.log('  No existing Tier-2 exam found');
        return;
    }

    const mocks = await prisma.mockTest.findMany({
        where: { examId: exam.id },
        include: {
            testQuestions: true,
            attempts: true
        }
    });

    console.log(`  Found ${mocks.length} existing mocks to delete`);

    for (const mock of mocks) {
        const questionIds = mock.testQuestions.map(tq => tq.questionId);
        const attemptIds = mock.attempts.map(a => a.id);

        // Delete in correct order to avoid FK constraints
        if (attemptIds.length > 0) {
            await prisma.attemptAnswer.deleteMany({
                where: { attemptId: { in: attemptIds } }
            });
        }

        await prisma.testAttempt.deleteMany({
            where: { testId: mock.id }
        });

        await prisma.testQuestion.deleteMany({
            where: { testId: mock.id }
        });

        await prisma.bookmark.deleteMany({
            where: { questionId: { in: questionIds } }
        });

        await prisma.questionExam.deleteMany({
            where: { questionId: { in: questionIds }, examId: exam.id }
        });

        await prisma.question.deleteMany({
            where: { id: { in: questionIds } }
        });

        await prisma.mockTest.delete({
            where: { id: mock.id }
        });

        console.log(`  Deleted: ${mock.name}`);
    }

    console.log('  ✅ Cleanup complete');
}

/**
 * Main seeding function
 */
async function seedTier2Mocks() {
    console.log('=========================================');
    console.log('SSC CGL Tier-2 Premium Mock Tests Seeder V3');
    console.log('=========================================\n');

    await cleanupExistingMocks();

    // Step 1: Category
    console.log('\n[1/5] Setting up exam category...');
    let category = await prisma.examCategory.findUnique({
        where: { slug: 'ssc' }
    });

    if (!category) {
        category = await prisma.examCategory.create({
            data: {
                name: 'SSC',
                slug: 'ssc',
                description: 'Staff Selection Commission Exams',
                isActive: true,
                order: 1
            }
        });
        console.log('  Created SSC category');
    } else {
        console.log('  Using existing SSC category');
    }

    // Step 2: Exam
    console.log('\n[2/5] Setting up SSC CGL Tier-2 exam...');
    let exam = await prisma.exam.findUnique({
        where: { slug: 'ssc-cgl-tier-2' }
    });

    if (!exam) {
        exam = await prisma.exam.create({
            data: {
                name: 'SSC CGL Tier-II 2026',
                slug: 'ssc-cgl-tier-2',
                fullName: 'Staff Selection Commission Combined Graduate Level Tier-II Examination 2026',
                description: 'SSC CGL Tier-II is the second stage of the Combined Graduate Level examination.',
                categoryId: category.id,
                status: 'PUBLISHED',
                isFeatured: true,
                metaTitle: 'SSC CGL Tier-II 2026 Mock Tests',
                metaDescription: 'Practice SSC CGL Tier-II with sectional mock tests.'
            }
        });
        console.log('  Created SSC CGL Tier-II 2026 exam');
    } else {
        console.log('  Using existing SSC CGL Tier-II exam');
    }

    // Step 3: Subjects
    console.log('\n[3/5] Setting up subjects...');
    const subjectMap: Record<string, string> = {};

    const subjectData = [
        { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude' },
        { name: 'Reasoning', slug: 'reasoning' },
        { name: 'English Language', slug: 'english-language' },
        { name: 'General Awareness', slug: 'general-awareness' }
    ];

    for (const sub of subjectData) {
        let subject = await prisma.subject.findUnique({ where: { slug: sub.slug } });
        if (!subject) {
            subject = await prisma.subject.create({
                data: { name: sub.name, slug: sub.slug, order: subjectData.indexOf(sub) }
            });
            console.log(`  Created subject: ${sub.name}`);
        } else {
            console.log(`  Using existing subject: ${sub.name}`);
        }
        subjectMap[sub.name] = subject.id;
    }

    // Get admin user
    const adminUser = await prisma.user.findFirst({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
    });

    if (!adminUser) {
        throw new Error('No admin user found. Please create an admin user first.');
    }
    console.log(`  Using admin user: ${adminUser.email}`);

    // Step 4: Process mock files
    console.log('\n[4/5] Processing mock test files...\n');

    const mockDir = path.join(__dirname, '..', '..', 'SSC CGL II');

    for (let mockNum = 1; mockNum <= 12; mockNum++) {
        const mockPath = path.join(mockDir, `mock${mockNum}.txt`);

        if (!fs.existsSync(mockPath)) {
            console.error(`  ❌ File not found: ${mockPath}`);
            continue;
        }

        console.log(`\n========== Processing Mock Test ${mockNum} ==========`);

        const mockSlug = `ssc-cgl-tier-2-mock-${mockNum}`;

        const parsed = parseMockFile(mockPath, mockNum);

        if (parsed.questions.length === 0) {
            console.error(`  ❌ No questions parsed for Mock ${mockNum}`);
            continue;
        }

        // Create sections JSON
        const sectionsJson = SECTIONS.map(s => ({
            name: s.name,
            questionsCount: s.endQ - s.startQ + 1
        }));

        // Create mock test
        const mockTest = await prisma.mockTest.create({
            data: {
                name: parsed.title,
                slug: mockSlug,
                description: `Full-length SSC CGL Tier-II Mock Test ${mockNum} with 130 questions.`,
                testType: 'FULL_LENGTH',
                totalQuestions: 130,
                totalMarks: 130,
                durationMinutes: 180,
                sectionalTiming: false,
                sections: sectionsJson,
                negativeMarking: 0.25,
                passingPercent: 40,
                accessType: 'PREMIUM',
                isAllIndia: false,
                instructions: `<h3>SSC CGL Tier-II Mock Test ${mockNum}</h3>
<ul>
<li><strong>Total Questions:</strong> 130</li>
<li><strong>Duration:</strong> 180 minutes</li>
<li><strong>Marking:</strong> +1 correct, -0.25 wrong</li>
</ul>`,
                status: 'PUBLISHED',
                publishedAt: new Date(),
                examId: exam.id,
                createdById: adminUser.id
            }
        });

        console.log(`  ✅ Created Mock Test: ${mockTest.name}`);

        // Create questions
        for (const q of parsed.questions) {
            const subjectId = subjectMap[q.subjectName];
            if (!subjectId) {
                console.error(`  ❌ Subject not found: ${q.subjectName}`);
                continue;
            }

            const correctKey = q.correctAnswer.toLowerCase();

            const options = [
                { id: 'A', text: q.optionA, isCorrect: correctKey === 'a' },
                { id: 'B', text: q.optionB, isCorrect: correctKey === 'b' },
                { id: 'C', text: q.optionC, isCorrect: correctKey === 'c' },
                { id: 'D', text: q.optionD, isCorrect: correctKey === 'd' },
            ];

            const question = await prisma.question.create({
                data: {
                    questionText: q.questionText,
                    questionType: 'MCQ_SINGLE',
                    options: options,
                    correctAnswer: q.correctAnswer,
                    solution: q.solution,
                    conceptNote: q.passage || null,
                    difficulty: 'MEDIUM',
                    status: 'PUBLISHED',
                    subjectId: subjectId,
                    createdById: adminUser.id,
                    source: 'ORIGINAL',
                    tags: ['SSC CGL', 'Tier-2', SECTIONS[q.sectionIndex].name]
                }
            });

            await prisma.questionExam.create({
                data: { questionId: question.id, examId: exam.id }
            });

            await prisma.testQuestion.create({
                data: {
                    testId: mockTest.id,
                    questionId: question.id,
                    sectionIndex: q.sectionIndex,
                    questionOrder: q.questionNumber,
                    marks: 1
                }
            });
        }

        console.log(`  ✅ Linked ${parsed.questions.length} questions`);
    }

    // Verification
    console.log('\n[5/5] Verification...');

    const tier2Mocks = await prisma.mockTest.findMany({
        where: { exam: { slug: 'ssc-cgl-tier-2' } },
        include: { _count: { select: { testQuestions: true } } }
    });

    console.log(`\n=========================================`);
    console.log(`SEEDING COMPLETE`);
    console.log(`=========================================`);
    console.log(`Total Tier-2 Mock Tests: ${tier2Mocks.length}`);

    for (const mock of tier2Mocks) {
        console.log(`  - ${mock.name}: ${mock._count.testQuestions} questions`);
    }

    // Spot check first question
    const firstQuestion = await prisma.question.findFirst({
        where: {
            testQuestions: {
                some: { test: { slug: 'ssc-cgl-tier-2-mock-1' } }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    if (firstQuestion) {
        console.log(`\n  Spot check Q1:`);
        console.log(`    Text: ${firstQuestion.questionText.substring(0, 50)}...`);
        const opts = firstQuestion.options as any[];
        console.log(`    Options: A="${opts[0]?.text}" B="${opts[1]?.text}" C="${opts[2]?.text}" D="${opts[3]?.text}"`);
    }

    console.log(`\n✅ All SSC CGL Tier-2 Premium Mock Tests seeded successfully!`);
}

// Run
seedTier2Mocks()
    .then(() => {
        console.log('\nSeeding completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
