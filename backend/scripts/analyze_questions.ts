
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== QUESTION ANALYSIS ===');

    // Group by Source
    const sourceGroups = await prisma.question.groupBy({
        by: ['source'],
        _count: true
    });
    console.log('\n--- BY SOURCE ---');
    console.log(sourceGroups);

    // Group by Date (Day)
    const questions = await prisma.question.findMany({
        select: { createdAt: true }
    });

    const dateMap: Record<string, number> = {};
    questions.forEach(q => {
        const date = q.createdAt.toISOString().split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
    });

    console.log('\n--- BY DATE ---');
    console.table(Object.entries(dateMap).sort());

    // Check Question Text of potential demos
    console.log('\n--- POTENTIAL DEMOS ---');
    // Assuming 'DEMO' or old dates are target
    const oldQuestions = await prisma.question.findMany({
        take: 5,
        orderBy: { createdAt: 'asc' },
        select: { id: true, questionText: true, source: true, createdAt: true }
    });
    console.log(oldQuestions);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
