import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
    console.log('Cleaning up SSC CGL 2026 Tier-2 mocks...');

    const mocks = await prisma.mockTest.findMany({
        where: { slug: { startsWith: 'ssc-cgl-2026-tier2' } },
        include: { testQuestions: true, attempts: true }
    });

    console.log(`Found ${mocks.length} mocks to delete`);

    for (const m of mocks) {
        const qIds = m.testQuestions.map(t => t.questionId);
        const aIds = m.attempts.map(a => a.id);

        if (aIds.length > 0) {
            await prisma.attemptAnswer.deleteMany({ where: { attemptId: { in: aIds } } });
        }

        await prisma.testAttempt.deleteMany({ where: { testId: m.id } });
        await prisma.testQuestion.deleteMany({ where: { testId: m.id } });
        await prisma.bookmark.deleteMany({ where: { questionId: { in: qIds } } });
        await prisma.questionExam.deleteMany({ where: { questionId: { in: qIds } } });
        await prisma.question.deleteMany({ where: { id: { in: qIds } } });
        await prisma.mockTest.delete({ where: { id: m.id } });

        console.log(`  Deleted: ${m.name}`);
    }

    console.log('Cleanup complete');
    await prisma.$disconnect();
}

cleanup().catch(console.error);
