import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkSections() {
    const mock = await prisma.mockTest.findFirst({
        where: { slug: 'ssc-cgl-2026-tier2-mock-1' }
    });

    if (!mock) {
        console.log('Mock not found');
        return;
    }

    console.log(`Mock: ${mock.name}`);
    console.log(`Sections JSON:`, mock.sections);

    const tqs = await prisma.testQuestion.findMany({
        where: { testId: mock.id },
        select: { sectionIndex: true, questionOrder: true },
        orderBy: { questionOrder: 'asc' }
    });

    const counts: Record<number, number> = {};
    tqs.forEach(t => counts[t.sectionIndex] = (counts[t.sectionIndex] || 0) + 1);

    console.log('\nSection distribution:');
    for (const [idx, count] of Object.entries(counts).sort((a, b) => Number(a[0]) - Number(b[0]))) {
        console.log(`  Section ${idx}: ${count} questions`);
    }

    // Check for section 4 (Computer Knowledge)
    const section4 = tqs.filter(t => t.sectionIndex === 4);
    console.log(`\nSection 4 (Computer) questions: ${section4.length}`);

    await prisma.$disconnect();
}

checkSections().catch(console.error);
