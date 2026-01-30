import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkPassages() {
    const questionsWithPassage = await prisma.question.count({
        where: { conceptNote: { not: null }, tags: { has: 'Tier-2' } }
    });
    console.log('Questions with passage/conceptNote:', questionsWithPassage);

    const sample = await prisma.question.findFirst({
        where: { conceptNote: { not: null }, tags: { has: 'Tier-2' } },
        select: { id: true, questionText: true, conceptNote: true }
    });

    if (sample) {
        console.log('\nSample passage question:');
        console.log('  Text:', sample.questionText?.substring(0, 100));
        console.log('  Passage:', sample.conceptNote?.substring(0, 300));
    } else {
        console.log('No questions with passages found');
    }

    await prisma.$disconnect();
}

checkPassages().catch(console.error);
