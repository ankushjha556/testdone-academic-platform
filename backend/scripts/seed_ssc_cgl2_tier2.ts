/**
 * SSC CGL Tier-2 2026 Premium Mock Tests Seeder V6
 * 
 * FIXES:
 * 1. Garbled UTF-8 encoding handling for Mock 06
 * 2. Non-breaking space handling
 * 3. Passage support
 * 4. Dynamic section counts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const SECTIONS = [
    { name: 'Mathematical Abilities', questionsCount: 30, order: 0, subjectSlug: 'quantitative-aptitude' },
    { name: 'Reasoning & General Intelligence', questionsCount: 30, order: 1, subjectSlug: 'reasoning' },
    { name: 'English Language & Comprehension', questionsCount: 45, order: 2, subjectSlug: 'english-language' },
    { name: 'General Awareness', questionsCount: 25, order: 3, subjectSlug: 'general-awareness' },
    { name: 'Computer Knowledge', questionsCount: 20, order: 4, subjectSlug: 'computer-knowledge' }
];

interface ParsedQuestion {
    globalOrder: number;
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
    difficulty: string;
    passage?: string;
}

function getSectionForGlobalOrder(globalOrder: number): typeof SECTIONS[0] {
    if (globalOrder <= 30) return SECTIONS[0];
    if (globalOrder <= 60) return SECTIONS[1];
    if (globalOrder <= 105) return SECTIONS[2];
    if (globalOrder <= 130) return SECTIONS[3];
    return SECTIONS[4];
}

// V6: Enhanced normalization for garbled UTF-8 encoding
function normalizeContent(content: string): string {
    return content
        // Garbled UTF-8 sequences (common from copy-paste)
        .replace(/â€"/g, '-')
        .replace(/â€'/g, '-')
        .replace(/â€™/g, "'")
        .replace(/â€˜/g, "'")
        .replace(/â€œ/g, '"')
        .replace(/â€/g, '"')
        // Non-breaking space (shows as Â in wrongly decoded UTF-8)
        .replace(/Â\s*/g, ' ')
        .replace(/Â/g, '')
        .replace(/\u00A0/g, ' ')
        // Unicode dashes
        .replace(/[\u2013\u2014\u2010\u2011\u2012]/g, '-')
        // Smart quotes
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        // Line endings
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

function extractPassages(content: string): Map<number, string> {
    const passageCache = new Map<number, string>();
    const passageRegex = /Reading Comprehension Passage\s*\d*\s*\(Questions?\s*(\d+)\s*[-]\s*(\d+)\)\s*:?\s*([\s\S]*?)(?=\n\n*(?:Question No:|Reading Comprehension|={3,}|$))/gi;
    let match;

    while ((match = passageRegex.exec(content)) !== null) {
        const startQ = parseInt(match[1]);
        const endQ = parseInt(match[2]);
        const passageText = match[3].trim();

        if (passageText.length > 50) {
            for (let q = startQ; q <= endQ; q++) {
                passageCache.set(q, passageText);
            }
        }
    }
    return passageCache;
}

function parseMockFile(filePath: string, mockNumber: number): ParsedQuestion[] {
    console.log(`\n========== Parsing Mock Test ${mockNumber} ==========`);

    let content = fs.readFileSync(filePath, 'utf-8');
    content = normalizeContent(content);

    const passageCache = extractPassages(content);
    console.log(`  Found ${passageCache.size ? 'passages for ' + passageCache.size + ' questions' : 'no passages'}`);

    const questionBlocks = content.split(/(?=Question No:\s*\d+)/i);

    const questions: ParsedQuestion[] = [];
    let globalOrder = 0;

    for (const block of questionBlocks) {
        const trimmedBlock = block.trim();
        if (!trimmedBlock.startsWith('Question No:')) continue;

        const qNumMatch = trimmedBlock.match(/Question No:\s*(\d+)/i);
        if (!qNumMatch) continue;

        globalOrder++;

        let topic = '';
        const topicMatch = trimmedBlock.match(/Topic:\s*([^\n]+)/i);
        if (topicMatch) topic = topicMatch[1].trim();

        let difficulty = 'MEDIUM';
        const diffMatch = trimmedBlock.match(/Difficulty Level:\s*([^\n]+)/i);
        if (diffMatch) {
            const diffText = diffMatch[1].toUpperCase();
            if (diffText.includes('EASY')) difficulty = 'EASY';
            else if (diffText.includes('HARD') || diffText.includes('TOUGH')) difficulty = 'HARD';
        }

        let questionText = '';
        const questionMatch = trimmedBlock.match(/Question:\s*\n?([\s\S]*?)(?=Options:|^A\))/im);
        if (questionMatch) {
            questionText = questionMatch[1]
                .split('\n')
                .filter(l => !l.trim().startsWith('Exam:') &&
                    !l.trim().startsWith('Tier:') &&
                    !l.trim().startsWith('Paper:') &&
                    !l.trim().startsWith('Session:') &&
                    !l.trim().startsWith('Section:') &&
                    !l.trim().startsWith('Module:') &&
                    !l.trim().startsWith('Subject:') &&
                    !l.trim().startsWith('Topic:') &&
                    !l.trim().startsWith('Difficulty') &&
                    !l.trim().startsWith('===') &&
                    !l.trim().startsWith('---'))
                .join(' ')
                .trim();
        }

        if (!questionText) {
            const altMatch = trimmedBlock.match(/Difficulty Level:[^\n]*\n+([^=\-]+?)(?=Options:|^A\))/im);
            if (altMatch) {
                questionText = altMatch[1].trim().split('\n')
                    .filter(l => l.trim() && !l.startsWith('===') && !l.startsWith('---'))
                    .join(' ');
            }
        }

        let optionA = '', optionB = '', optionC = '', optionD = '';

        const optionsMatch = trimmedBlock.match(/Options:\s*([\s\S]*?)(?=Correct Answer:|$)/i);
        if (optionsMatch) {
            const optionsText = optionsMatch[1];
            const optAMatch = optionsText.match(/A\)\s*([^\n]+)/i);
            const optBMatch = optionsText.match(/B\)\s*([^\n]+)/i);
            const optCMatch = optionsText.match(/C\)\s*([^\n]+)/i);
            const optDMatch = optionsText.match(/D\)\s*([^\n]+)/i);

            if (optAMatch) optionA = optAMatch[1].trim();
            if (optBMatch) optionB = optBMatch[1].trim();
            if (optCMatch) optionC = optCMatch[1].trim();
            if (optDMatch) optionD = optDMatch[1].trim();
        }

        if (!optionA) {
            const directOptA = trimmedBlock.match(/^A\)\s*([^\n]+)/im);
            const directOptB = trimmedBlock.match(/^B\)\s*([^\n]+)/im);
            const directOptC = trimmedBlock.match(/^C\)\s*([^\n]+)/im);
            const directOptD = trimmedBlock.match(/^D\)\s*([^\n]+)/im);

            if (directOptA) optionA = directOptA[1].trim();
            if (directOptB) optionB = directOptB[1].trim();
            if (directOptC) optionC = directOptC[1].trim();
            if (directOptD) optionD = directOptD[1].trim();
        }

        let correctAnswer = '';
        const correctMatch = trimmedBlock.match(/Correct Answer:\s*\n?\s*([A-D])\)/i);
        if (correctMatch) {
            correctAnswer = correctMatch[1].toUpperCase();
        } else {
            const altCorrectMatch = trimmedBlock.match(/Correct Answer:\s*\n?\s*([A-D])/i);
            if (altCorrectMatch) correctAnswer = altCorrectMatch[1].toUpperCase();
        }

        let solution = '';
        const solutionMatch = trimmedBlock.match(/Detailed Solution:\s*([\s\S]*?)(?=={3,}|-{3,}|Question No:|$)/i);
        if (solutionMatch) {
            solution = solutionMatch[1].trim().split('\n').join(' ').substring(0, 2000);
        }

        const section = getSectionForGlobalOrder(globalOrder);
        const passage = passageCache.get(globalOrder);

        if (!questionText || !correctAnswer) {
            console.log(`  Skipping Q${globalOrder}: missing text or answer`);
            globalOrder--;
            continue;
        }

        questions.push({
            globalOrder, questionText, optionA, optionB, optionC, optionD, correctAnswer, solution,
            sectionIndex: section.order, sectionName: section.name, subjectSlug: section.subjectSlug,
            topic, difficulty, passage
        });
    }

    console.log(`  Total questions parsed: ${questions.length}`);
    const sectionCounts = [0, 0, 0, 0, 0];
    questions.forEach(q => sectionCounts[q.sectionIndex]++);
    console.log(`  Section distribution: ${sectionCounts.join(', ')}`);

    return questions;
}

function calculateActualSections(questions: ParsedQuestion[]) {
    const sectionCounts = [0, 0, 0, 0, 0];
    questions.forEach(q => sectionCounts[q.sectionIndex]++);

    return SECTIONS.map((s, idx) => ({
        name: s.name,
        questionsCount: sectionCounts[idx],
        marks: sectionCounts[idx] * 3,
        hasQuestions: sectionCounts[idx] > 0
    }));
}

async function seedTier2Mocks() {
    console.log('=========================================');
    console.log('SSC CGL Tier-2 2026 Premium Mock Tests V6');
    console.log('=========================================\n');

    let category = await prisma.examCategory.findUnique({ where: { slug: 'ssc' } });
    if (!category) {
        category = await prisma.examCategory.create({
            data: { name: 'SSC', slug: 'ssc', description: 'Staff Selection Commission Exams', isActive: true, order: 1 }
        });
    }

    let exam = await prisma.exam.findUnique({ where: { slug: 'ssc-cgl-2026' } });
    if (!exam) {
        exam = await prisma.exam.create({
            data: {
                name: 'SSC CGL 2026', slug: 'ssc-cgl-2026',
                fullName: 'Staff Selection Commission Combined Graduate Level Examination 2026',
                description: 'SSC CGL is one of the most prestigious exams.',
                categoryId: category.id, status: 'PUBLISHED', isFeatured: true
            }
        });
    }

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
            subject = await prisma.subject.create({ data: { name: sub.name, slug: sub.slug, order: subjectData.indexOf(sub) } });
        }
        subjectMap[sub.slug] = subject.id;
    }

    const adminUser = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
    if (!adminUser) throw new Error('No admin user found');

    const mockDir = path.join(__dirname, '..', '..', 'SSC_CGL_2');
    let mocksCreated = 0;
    let totalQuestionsCreated = 0;

    for (let mockNum = 1; mockNum <= 10; mockNum++) {
        const paddedNum = mockNum.toString().padStart(2, '0');
        const mockPath = path.join(mockDir, `SSC_CGL_2026_Tier2_Full_Mock_${paddedNum}.txt`);

        if (!fs.existsSync(mockPath)) {
            console.error(`  File not found: Mock ${mockNum}`);
            continue;
        }

        const mockSlug = `ssc-cgl-2026-tier2-mock-${mockNum}`;
        const existingMock = await prisma.mockTest.findUnique({ where: { slug: mockSlug } });

        if (existingMock) {
            console.log(`  Mock ${mockNum} already exists, skipping...`);
            continue;
        }

        const questions = parseMockFile(mockPath, mockNum);

        if (questions.length < 50) {
            console.error(`  Insufficient questions for Mock ${mockNum}: ${questions.length}`);
            continue;
        }

        const actualSections = calculateActualSections(questions);

        const mockTest = await prisma.mockTest.create({
            data: {
                name: `SSC CGL Tier-II 2026 Mock Test ${mockNum}`,
                slug: mockSlug,
                description: `SSC CGL Tier-II 2026 Premium Mock Test ${mockNum}.`,
                testType: 'FULL_LENGTH',
                totalQuestions: questions.length,
                totalMarks: questions.length * 3,
                durationMinutes: 150,
                sectionalTiming: false,
                sections: actualSections,
                negativeMarking: 1.00,
                passingPercent: 40,
                accessType: 'PREMIUM',
                isAllIndia: false,
                instructions: `<h3>SSC CGL Tier-II 2026 Mock Test ${mockNum}</h3>
<p>Total Questions: ${questions.length} | Duration: 150 min | Marking: +3/-1</p>
${actualSections.filter(s => !s.hasQuestions).map(s =>
                    `<p style="color: #d97706;"><strong>Note:</strong> ${s.name} section is not available in this mock.</p>`
                ).join('')}`,
                status: 'PUBLISHED',
                publishedAt: new Date(),
                examId: exam.id,
                createdById: adminUser.id
            }
        });

        console.log(`  Created: ${mockTest.name} (${questions.length} Qs)`);

        for (const q of questions) {
            const subjectId = subjectMap[q.subjectSlug];
            if (!subjectId) continue;

            const options = [
                { id: 'A', text: q.optionA, isCorrect: q.correctAnswer === 'A' },
                { id: 'B', text: q.optionB, isCorrect: q.correctAnswer === 'B' },
                { id: 'C', text: q.optionC, isCorrect: q.correctAnswer === 'C' },
                { id: 'D', text: q.optionD, isCorrect: q.correctAnswer === 'D' },
            ];

            const question = await prisma.question.create({
                data: {
                    questionText: q.questionText,
                    questionType: 'MCQ_SINGLE',
                    options: options,
                    correctAnswer: q.correctAnswer,
                    solution: q.solution || '',
                    conceptNote: q.passage || null,
                    difficulty: q.difficulty as any,
                    status: 'PUBLISHED',
                    subjectId: subjectId,
                    createdById: adminUser.id,
                    source: 'ORIGINAL',
                    tags: ['SSC CGL', 'Tier-2', '2026', q.sectionName, q.topic].filter(Boolean)
                }
            });

            await prisma.questionExam.create({ data: { questionId: question.id, examId: exam.id } });
            await prisma.testQuestion.create({
                data: {
                    testId: mockTest.id,
                    questionId: question.id,
                    sectionIndex: q.sectionIndex,
                    questionOrder: q.globalOrder,
                    marks: 3
                }
            });

            totalQuestionsCreated++;
        }

        mocksCreated++;
    }

    console.log(`\n=========================================`);
    console.log(`SEEDING COMPLETE: ${mocksCreated}/10 mocks, ${totalQuestionsCreated} questions`);
    console.log(`=========================================`);
}

seedTier2Mocks()
    .then(() => { console.log('Done.'); process.exit(0); })
    .catch((e) => { console.error('Failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
