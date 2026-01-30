/**
 * SSC CGL Tier-2 2026 Premium Mock Tests Seeder V7
 * 
 * This script seeds ALL 15 SSC CGL Tier-2 mock tests from the SSC_CGL_2 directory.
 * 
 * FEATURES:
 * - Handles 150 questions per mock (5 sections)
 * - Supports multiple file formats (with/without markdown separators)
 * - Idempotent: skips already-seeded mocks
 * - Preserves exact question order, options, and solutions
 * - Sets accessType: PREMIUM for all tests
 * 
 * SECTIONS (150 Questions Total):
 * 1. Mathematical Abilities (Q1-30)
 * 2. Reasoning & General Intelligence (Q31-60)
 * 3. English Language & Comprehension (Q61-105)
 * 4. General Awareness (Q106-130)
 * 5. Computer Knowledge (Q131-150)
 * 
 * MARKING SCHEME:
 * - +3 marks for correct answer
 * - -1 mark for wrong answer
 * - 0 marks for unattempted
 */

import { PrismaClient, Difficulty } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Section definitions for SSC CGL Tier-2 (150 questions)
const SECTIONS = [
    { name: 'Mathematical Abilities', startQ: 1, endQ: 30, order: 0, subjectSlug: 'quantitative-aptitude' },
    { name: 'Reasoning & General Intelligence', startQ: 31, endQ: 60, order: 1, subjectSlug: 'reasoning' },
    { name: 'English Language & Comprehension', startQ: 61, endQ: 105, order: 2, subjectSlug: 'english-language' },
    { name: 'General Awareness', startQ: 106, endQ: 130, order: 3, subjectSlug: 'general-awareness' },
    { name: 'Computer Knowledge', startQ: 131, endQ: 150, order: 4, subjectSlug: 'computer-knowledge' }
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
    sectionName: string;
    subjectSlug: string;
    topic: string;
    difficulty: Difficulty;
}

/**
 * Normalize content to handle various encoding issues and formatting
 */
function normalizeContent(content: string): string {
    return content
        // Garbled UTF-8 sequences
        .replace(/â€"/g, '-')
        .replace(/â€'/g, '-')
        .replace(/â€™/g, "'")
        .replace(/â€˜/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€/g, '"')
        // Non-breaking space
        .replace(/Â\s*/g, ' ')
        .replace(/Â/g, '')
        .replace(/\u00A0/g, ' ')
        // Unicode dashes
        .replace(/[\u2013\u2014\u2010\u2011\u2012–—]/g, '-')
        // Smart quotes
        .replace(/[\u2018\u2019'']/g, "'")
        .replace(/[\u201C\u201D""]/g, '"')
        // Line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Multiple spaces
        .replace(/  +/g, ' ');
}

/**
 * Get section for a given question number
 */
function getSectionForQuestion(qNum: number): typeof SECTIONS[0] {
    for (const section of SECTIONS) {
        if (qNum >= section.startQ && qNum <= section.endQ) {
            return section;
        }
    }
    // Default to last section if out of range
    return SECTIONS[SECTIONS.length - 1];
}

/**
 * Parse difficulty from text
 */
function parseDifficulty(text: string): Difficulty {
    const lower = text.toLowerCase();
    if (lower.includes('easy')) return 'EASY';
    if (lower.includes('hard') || lower.includes('tough')) return 'HARD';
    return 'MEDIUM';
}

/**
 * Extract text from option string (remove leading letter and parenthesis)
 */
function cleanOptionText(text: string): string {
    return text
        .replace(/^[A-D]\)\s*/i, '')
        .replace(/^[A-D]\.\s*/i, '')
        .trim();
}

/**
 * Parse a mock test file
 */
function parseMockFile(filePath: string, mockNumber: number): ParsedQuestion[] {
    console.log(`\n========== Parsing Mock Test ${mockNumber} ==========`);
    console.log(`  File: ${path.basename(filePath)}`);

    let content = fs.readFileSync(filePath, 'utf-8');
    content = normalizeContent(content);

    const questions: ParsedQuestion[] = [];

    // Split into question blocks using "Question No:" pattern
    const questionBlocks = content.split(/(?=Question No:\s*\d+)/i);
    console.log(`  Found ${questionBlocks.length - 1} question blocks`);

    for (const block of questionBlocks) {
        const trimmedBlock = block.trim();
        if (!trimmedBlock.match(/^Question No:/i)) continue;

        // Extract question number
        const qNumMatch = trimmedBlock.match(/Question No:\s*(\d+)/i);
        if (!qNumMatch) continue;

        const qNum = parseInt(qNumMatch[1]);

        // Extract topic
        let topic = '';
        const topicMatch = trimmedBlock.match(/Topic:\s*([^\n]+)/i);
        if (topicMatch) {
            topic = topicMatch[1].trim();
        }

        // Extract difficulty
        let difficulty: Difficulty = 'MEDIUM';
        const diffMatch = trimmedBlock.match(/Difficulty Level:\s*([^\n]+)/i);
        if (diffMatch) {
            difficulty = parseDifficulty(diffMatch[1]);
        }

        // Extract question text
        let questionText = '';
        const questionMatch = trimmedBlock.match(/Question:\s*\n?([\s\S]*?)(?=Options:|^[A-D]\))/im);
        if (questionMatch) {
            questionText = questionMatch[1]
                .split('\n')
                .filter(l =>
                    !l.trim().startsWith('Exam:') &&
                    !l.trim().startsWith('Tier:') &&
                    !l.trim().startsWith('Paper:') &&
                    !l.trim().startsWith('Session:') &&
                    !l.trim().startsWith('Section:') &&
                    !l.trim().startsWith('Module:') &&
                    !l.trim().startsWith('Subject:') &&
                    !l.trim().startsWith('Topic:') &&
                    !l.trim().startsWith('Difficulty') &&
                    !l.trim().startsWith('===') &&
                    !l.trim().startsWith('---') &&
                    !l.trim().startsWith('###') &&
                    l.trim().length > 0
                )
                .join(' ')
                .trim();
        }

        // If no question text found, try alternative parsing
        if (!questionText) {
            const altMatch = trimmedBlock.match(/Difficulty Level:[^\n]*\n+([^=\-#]+?)(?=Options:|^[A-D]\))/im);
            if (altMatch) {
                questionText = altMatch[1].trim()
                    .split('\n')
                    .filter(l => l.trim() && !l.startsWith('===') && !l.startsWith('---'))
                    .join(' ');
            }
        }

        // Extract options
        let optionA = '', optionB = '', optionC = '', optionD = '';

        // Try Options: block first
        const optionsMatch = trimmedBlock.match(/Options:\s*([\s\S]*?)(?=Correct Answer:|$)/i);
        if (optionsMatch) {
            const optionsText = optionsMatch[1];
            const optAMatch = optionsText.match(/A\)\s*([^\n]+)/i);
            const optBMatch = optionsText.match(/B\)\s*([^\n]+)/i);
            const optCMatch = optionsText.match(/C\)\s*([^\n]+)/i);
            const optDMatch = optionsText.match(/D\)\s*([^\n]+)/i);

            if (optAMatch) optionA = cleanOptionText(optAMatch[1]);
            if (optBMatch) optionB = cleanOptionText(optBMatch[1]);
            if (optCMatch) optionC = cleanOptionText(optCMatch[1]);
            if (optDMatch) optionD = cleanOptionText(optDMatch[1]);
        }

        // If options not found, try direct pattern matching
        if (!optionA || !optionB || !optionC || !optionD) {
            const directOptA = trimmedBlock.match(/^A\)\s*(.+)$/im);
            const directOptB = trimmedBlock.match(/^B\)\s*(.+)$/im);
            const directOptC = trimmedBlock.match(/^C\)\s*(.+)$/im);
            const directOptD = trimmedBlock.match(/^D\)\s*(.+)$/im);

            if (directOptA && !optionA) optionA = cleanOptionText(directOptA[1]);
            if (directOptB && !optionB) optionB = cleanOptionText(directOptB[1]);
            if (directOptC && !optionC) optionC = cleanOptionText(directOptC[1]);
            if (directOptD && !optionD) optionD = cleanOptionText(directOptD[1]);
        }

        // Extract correct answer
        let correctAnswer = '';
        const correctMatch = trimmedBlock.match(/Correct Answer:\s*\n?\s*([A-D])\)?/i);
        if (correctMatch) {
            correctAnswer = correctMatch[1].toUpperCase();
        }

        // Extract solution
        let solution = '';
        const solutionMatch = trimmedBlock.match(/Detailed Solution:\s*([\s\S]*?)(?=^-{3,}|^={3,}|Question No:|$)/im);
        if (solutionMatch) {
            solution = solutionMatch[1]
                .trim()
                .split('\n')
                .join(' ')
                .substring(0, 3000); // Limit solution length
        }

        // Validate required fields
        if (!questionText || !correctAnswer) {
            console.log(`  ⚠️ Skipping Q${qNum}: missing text or answer`);
            continue;
        }

        // Get section info
        const section = getSectionForQuestion(qNum);

        questions.push({
            questionNumber: qNum,
            questionText,
            optionA: optionA || 'Option A',
            optionB: optionB || 'Option B',
            optionC: optionC || 'Option C',
            optionD: optionD || 'Option D',
            correctAnswer,
            solution,
            sectionIndex: section.order,
            sectionName: section.name,
            subjectSlug: section.subjectSlug,
            topic,
            difficulty
        });
    }

    // Sort by question number
    questions.sort((a, b) => a.questionNumber - b.questionNumber);

    console.log(`  ✅ Total questions parsed: ${questions.length}`);

    // Log section distribution
    const sectionCounts = [0, 0, 0, 0, 0];
    questions.forEach(q => sectionCounts[q.sectionIndex]++);
    console.log(`  Section distribution: ${sectionCounts.join(', ')} (expected: 30, 30, 45, 25, 20)`);

    // Check for missing options
    const missingOptions = questions.filter(q =>
        !q.optionA || !q.optionB || !q.optionC || !q.optionD ||
        q.optionA === 'Option A'
    ).length;
    if (missingOptions > 0) {
        console.log(`  ⚠️ ${missingOptions} questions have missing/placeholder options`);
    }

    return questions;
}

/**
 * Calculate actual section data from parsed questions
 */
function calculateSectionsData(questions: ParsedQuestion[]) {
    const sectionCounts = [0, 0, 0, 0, 0];
    questions.forEach(q => sectionCounts[q.sectionIndex]++);

    return SECTIONS.map((s, idx) => ({
        name: s.name,
        questionsCount: sectionCounts[idx],
        marks: sectionCounts[idx] * 3,
        startQ: s.startQ,
        endQ: s.endQ
    }));
}

/**
 * Main seeding function
 */
async function seedTier2Mocks() {
    console.log('=========================================');
    console.log('SSC CGL Tier-2 2026 Premium Mock Tests V7');
    console.log('Seeding 15 Premium Mock Tests');
    console.log('=========================================\n');

    // Step 1: Ensure SSC category exists
    console.log('[1/6] Setting up exam category...');
    let category = await prisma.examCategory.findUnique({ where: { slug: 'ssc' } });
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

    // Step 2: Ensure SSC CGL 2026 exam exists
    console.log('\n[2/6] Setting up exam...');
    let exam = await prisma.exam.findUnique({ where: { slug: 'ssc-cgl-2026' } });
    if (!exam) {
        exam = await prisma.exam.create({
            data: {
                name: 'SSC CGL 2026',
                slug: 'ssc-cgl-2026',
                fullName: 'Staff Selection Commission Combined Graduate Level Examination 2026',
                description: 'SSC CGL is one of the most prestigious government job exams in India.',
                categoryId: category.id,
                status: 'PUBLISHED',
                isFeatured: true,
                metaTitle: 'SSC CGL 2026 Mock Tests | Free & Premium Tests',
                metaDescription: 'Practice SSC CGL 2026 with full-length mock tests including Tier-1 and Tier-2.'
            }
        });
        console.log('  Created SSC CGL 2026 exam');
    } else {
        console.log('  Using existing SSC CGL 2026 exam');
    }

    // Step 3: Ensure subjects exist
    console.log('\n[3/6] Setting up subjects...');
    const subjectMap: Record<string, string> = {};
    const subjectData = [
        { name: 'Quantitative Aptitude', slug: 'quantitative-aptitude' },
        { name: 'Reasoning', slug: 'reasoning' },
        { name: 'English Language', slug: 'english-language' },
        { name: 'General Awareness', slug: 'general-awareness' },
        { name: 'Computer Knowledge', slug: 'computer-knowledge' }
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
        subjectMap[sub.slug] = subject.id;
    }

    // Get admin user
    console.log('\n[4/6] Getting admin user...');
    const adminUser = await prisma.user.findFirst({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }
    });

    if (!adminUser) {
        throw new Error('No admin user found. Please create an admin user first.');
    }
    console.log(`  Using admin user: ${adminUser.email}`);

    // Step 4: Process all 15 mock files
    console.log('\n[5/6] Processing mock test files...');
    const mockDir = path.join(__dirname, '..', '..', 'SSC_CGL_2');

    let mocksCreated = 0;
    let mocksSkipped = 0;
    let totalQuestionsCreated = 0;

    for (let mockNum = 1; mockNum <= 15; mockNum++) {
        const paddedNum = mockNum.toString().padStart(2, '0');
        const mockPath = path.join(mockDir, `SSC_CGL_2026_Tier2_Full_Mock_${paddedNum}.txt`);

        if (!fs.existsSync(mockPath)) {
            console.error(`\n  ❌ File not found: SSC_CGL_2026_Tier2_Full_Mock_${paddedNum}.txt`);
            continue;
        }

        const mockSlug = `ssc-cgl-2026-tier2-mock-${mockNum}`;

        // Check if mock already exists (idempotent)
        const existingMock = await prisma.mockTest.findUnique({ where: { slug: mockSlug } });
        if (existingMock) {
            console.log(`\n  ⏭️ Mock ${mockNum} already exists (${existingMock.totalQuestions} Qs), skipping...`);
            mocksSkipped++;
            continue;
        }

        // Parse the mock file
        const questions = parseMockFile(mockPath, mockNum);

        if (questions.length < 50) {
            console.error(`  ❌ Insufficient questions for Mock ${mockNum}: ${questions.length}`);
            continue;
        }

        // Calculate actual sections data
        const sectionsData = calculateSectionsData(questions);
        const totalMarks = questions.length * 3;

        // Create the mock test record
        const mockTest = await prisma.mockTest.create({
            data: {
                name: `SSC CGL Tier-II 2026 Mock Test ${mockNum}`,
                slug: mockSlug,
                description: `Full-length SSC CGL Tier-II 2026 Premium Mock Test ${mockNum} with ${questions.length} questions across 5 sections.`,
                testType: 'FULL_LENGTH',
                totalQuestions: questions.length,
                totalMarks: totalMarks,
                durationMinutes: 150, // 2 hours 30 minutes
                sectionalTiming: false, // Combined timer
                sections: sectionsData,
                negativeMarking: 1.00, // -1 per wrong answer
                passingPercent: 40,
                accessType: 'PREMIUM', // All Tier-2 mocks are premium
                isAllIndia: false,
                instructions: `<h3>SSC CGL Tier-II 2026 Mock Test ${mockNum}</h3>
<ul>
<li><strong>Total Questions:</strong> ${questions.length}</li>
<li><strong>Total Marks:</strong> ${totalMarks}</li>
<li><strong>Duration:</strong> 2 hours 30 minutes (150 minutes)</li>
<li><strong>Marking:</strong> +3 for correct, -1 for wrong, 0 for unattempted</li>
</ul>
<h4>Sections:</h4>
<ul>
${sectionsData.map(s => `<li>${s.name}: ${s.questionsCount} questions (${s.marks} marks)</li>`).join('\n')}
</ul>
<p><strong>Note:</strong> This is a premium exam-simulation mock test designed as per SSC CGL Tier-II 2026 pattern.</p>`,
                status: 'PUBLISHED',
                publishedAt: new Date(),
                examId: exam.id,
                createdById: adminUser.id
            }
        });

        console.log(`  ✅ Created Mock Test: ${mockTest.name}`);

        // Create questions and link them to the mock test
        for (const q of questions) {
            const subjectId = subjectMap[q.subjectSlug];
            if (!subjectId) {
                console.error(`  ❌ Subject not found: ${q.subjectSlug}`);
                continue;
            }

            const options = [
                { id: 'A', text: q.optionA, isCorrect: q.correctAnswer === 'A' },
                { id: 'B', text: q.optionB, isCorrect: q.correctAnswer === 'B' },
                { id: 'C', text: q.optionC, isCorrect: q.correctAnswer === 'C' },
                { id: 'D', text: q.optionD, isCorrect: q.correctAnswer === 'D' },
            ];

            // Create the question
            const question = await prisma.question.create({
                data: {
                    questionText: q.questionText,
                    questionType: 'MCQ_SINGLE',
                    options: options,
                    correctAnswer: q.correctAnswer,
                    solution: q.solution || '',
                    difficulty: q.difficulty,
                    status: 'PUBLISHED',
                    subjectId: subjectId,
                    createdById: adminUser.id,
                    source: 'ORIGINAL',
                    tags: ['SSC CGL', 'Tier-2', '2026', q.sectionName, q.topic].filter(Boolean)
                }
            });

            // Link question to exam
            await prisma.questionExam.create({
                data: { questionId: question.id, examId: exam.id }
            });

            // Link question to mock test
            await prisma.testQuestion.create({
                data: {
                    testId: mockTest.id,
                    questionId: question.id,
                    sectionIndex: q.sectionIndex,
                    questionOrder: q.questionNumber,
                    marks: 3 // +3 marks per correct answer
                }
            });

            totalQuestionsCreated++;
        }

        console.log(`  ✅ Linked ${questions.length} questions to mock test`);
        mocksCreated++;
    }

    // Step 6: Verification
    console.log('\n[6/6] Verification...');

    const tier2Mocks = await prisma.mockTest.findMany({
        where: {
            slug: { startsWith: 'ssc-cgl-2026-tier2-mock-' }
        },
        include: {
            _count: { select: { testQuestions: true } }
        },
        orderBy: { name: 'asc' }
    });

    console.log(`\n=========================================`);
    console.log(`SEEDING COMPLETE`);
    console.log(`=========================================`);
    console.log(`Total Tier-2 Mock Tests: ${tier2Mocks.length}`);
    console.log(`  - Created this run: ${mocksCreated}`);
    console.log(`  - Skipped (existing): ${mocksSkipped}`);
    console.log(`Total Questions Created: ${totalQuestionsCreated}`);
    console.log(`\nMock Tests Summary:`);

    for (const mock of tier2Mocks) {
        console.log(`  - ${mock.name}: ${mock._count.testQuestions} questions (${mock.accessType})`);
    }

    // Verify access type
    const premiumMocks = tier2Mocks.filter(m => m.accessType === 'PREMIUM');
    if (premiumMocks.length === tier2Mocks.length) {
        console.log(`\n✅ All ${tier2Mocks.length} mocks are correctly set as PREMIUM`);
    } else {
        console.log(`\n⚠️ Warning: ${tier2Mocks.length - premiumMocks.length} mocks are NOT premium`);
    }

    console.log(`\n✅ SSC CGL Tier-2 Premium Mock Tests seeding completed!`);
}

// Run the seeder
seedTier2Mocks()
    .then(() => {
        console.log('\nSeeding process finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
