/**
 * Verification script for SSC CGL Tier-2 Mock Tests
 * Run after seeding to verify data integrity
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log('=========================================');
    console.log('SSC CGL Tier-2 Mock Tests Verification');
    console.log('=========================================\n');

    // 1. Check exam exists
    const exam = await prisma.exam.findUnique({
        where: { slug: 'ssc-cgl-tier-2' },
        include: { category: true }
    });

    if (!exam) {
        console.log('❌ SSC CGL Tier-2 exam NOT found!');
        return false;
    }

    console.log('✅ Exam found:', exam.name);
    console.log('   Category:', exam.category?.name || 'N/A');
    console.log('   Status:', exam.status);

    // 2. Check mock tests
    const mocks = await prisma.mockTest.findMany({
        where: { examId: exam.id },
        include: {
            _count: { select: { testQuestions: true } }
        },
        orderBy: { name: 'asc' }
    });

    console.log(`\n✅ Found ${mocks.length} mock tests`);

    let allValid = true;

    for (const mock of mocks) {
        const qCount = mock._count.testQuestions;
        const status = qCount === 130 ? '✅' : '❌';

        if (qCount !== 130) allValid = false;

        console.log(`   ${status} ${mock.name}: ${qCount} questions`);
        console.log(`      Duration: ${mock.durationMinutes} min, Access: ${mock.accessType}`);
    }

    // 3. Verify section distribution for first mock
    const firstMock = mocks[0];
    if (firstMock) {
        const testQuestions = await prisma.testQuestion.findMany({
            where: { testId: firstMock.id },
            orderBy: { questionOrder: 'asc' }
        });

        const sectionCounts = [0, 0, 0, 0];
        testQuestions.forEach(tq => {
            if (tq.sectionIndex >= 0 && tq.sectionIndex <= 3) {
                sectionCounts[tq.sectionIndex]++;
            }
        });

        console.log(`\n✅ Section distribution for ${firstMock.name}:`);
        console.log(`   Section 0 (Math): ${sectionCounts[0]} (expected: 30)`);
        console.log(`   Section 1 (Reasoning): ${sectionCounts[1]} (expected: 30)`);
        console.log(`   Section 2 (English): ${sectionCounts[2]} (expected: 45)`);
        console.log(`   Section 3 (GA): ${sectionCounts[3]} (expected: 25)`);

        if (sectionCounts[0] !== 30 || sectionCounts[1] !== 30 ||
            sectionCounts[2] !== 45 || sectionCounts[3] !== 25) {
            allValid = false;
        }
    }

    // 4. Verify answers exist
    const questionWithAnswer = await prisma.question.findFirst({
        where: {
            testQuestions: {
                some: { test: { examId: exam.id } }
            }
        }
    });

    if (questionWithAnswer?.correctAnswer) {
        console.log(`\n✅ Sample question has correct answer: ${questionWithAnswer.correctAnswer}`);
    } else {
        console.log('\n❌ Questions missing correct answers!');
        allValid = false;
    }

    // 5. Final verdict
    console.log('\n=========================================');
    if (allValid && mocks.length === 12) {
        console.log('✅ VERIFICATION PASSED - All 12 mocks ready!');
    } else {
        console.log('❌ VERIFICATION FAILED - Please check errors above');
    }
    console.log('=========================================');

    return allValid && mocks.length === 12;
}

verify()
    .then(success => process.exit(success ? 0 : 1))
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
