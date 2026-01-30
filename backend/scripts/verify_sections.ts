import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllMocks() {
    console.log('Checking all 10 Mocks...');
    console.log('------------------------------------------------------------------');
    console.log('| Mock | Total | Math | Reas | Eng  | GA   | Comp | Status       |');
    console.log('------------------------------------------------------------------');

    for (let i = 1; i <= 10; i++) {
        const slug = `ssc-cgl-2026-tier2-mock-${i}`;
        const mock = await prisma.mockTest.findUnique({
            where: { slug }
        });

        if (!mock) {
            console.log(`| ${i.toString().padEnd(4)} | NOT FOUND                                              |`);
            continue;
        }

        const tqs = await prisma.testQuestion.findMany({
            where: { testId: mock.id },
            select: { sectionIndex: true }
        });

        const counts = [0, 0, 0, 0, 0];
        tqs.forEach(t => {
            if (t.sectionIndex >= 0 && t.sectionIndex < 5) {
                counts[t.sectionIndex]++;
            }
        });

        const total = tqs.length;
        const status = counts[4] === 0 ? 'NO COMPUTER' : 'OK';

        console.log(`Mock ${i}: Total=${total}, Distribution=[${counts.join(', ')}], Status=${status}`);
    }
    console.log('------------------------------------------------------------------');
    await prisma.$disconnect();
}

checkAllMocks().catch(console.error);
