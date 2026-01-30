import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkMock6() {
    const mock = await prisma.mockTest.findFirst({
        where: { slug: 'ssc-cgl-2026-tier2-mock-6' }
    });
    if (!mock) { console.log('Mock 6 NOT FOUND'); return; }

    const questions = await prisma.testQuestion.findMany({
        where: { testId: mock.id }
    });

    console.log(`Mock 6 Total: ${questions.length}`);
    const counts = [0, 0, 0, 0, 0];
    questions.forEach(q => counts[q.sectionIndex]++);
    console.log(`Distribution: ${counts.join(', ')}`);
}
checkMock6();
