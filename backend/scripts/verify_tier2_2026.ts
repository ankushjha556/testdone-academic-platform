import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
    const mocks = await prisma.mockTest.findMany({
        where: { slug: { startsWith: 'ssc-cgl-2026-tier2' } },
        include: { _count: { select: { testQuestions: true } } },
        orderBy: { name: 'asc' }
    });

    console.log('SSC CGL Tier-2 2026 Mocks:');
    console.log('==========================');

    for (const mock of mocks) {
        console.log(`${mock.name}: ${mock._count.testQuestions} questions, ${mock.accessType}`);
    }

    console.log(`\nTotal mocks: ${mocks.length}`);

    // Check section distribution for first mock
    if (mocks.length > 0) {
        const testQuestions = await prisma.testQuestion.findMany({
            where: { testId: mocks[0].id },
            orderBy: { questionOrder: 'asc' }
        });

        const sectionCounts = [0, 0, 0, 0, 0];
        testQuestions.forEach(tq => sectionCounts[tq.sectionIndex]++);
        console.log(`\nSection distribution (Mock 1): ${sectionCounts.join(', ')}`);
    }

    await prisma.$disconnect();
}

verify().catch(console.error);
