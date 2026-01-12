const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    const testQuestions = await prisma.testQuestion.findMany({
        where: { test: { slug: 'ssc-cgl-mock-1' } },
        orderBy: { questionOrder: 'asc' },
        take: 10,
        include: {
            question: {
                select: {
                    questionText: true,
                    correctAnswer: true,
                    solution: true
                }
            }
        }
    });

    console.log('=== Verification of First 10 Questions ===\n');

    testQuestions.forEach(tq => {
        console.log(`Q${tq.questionOrder}: ${tq.question.questionText.substring(0, 60)}...`);
        console.log(`   Correct Answer: ${tq.question.correctAnswer}`);
        console.log(`   Solution: ${tq.question.solution ? tq.question.solution.substring(0, 60) + '...' : 'N/A'}`);
        console.log('');
    });

    await prisma.$disconnect();
}

verify().catch(console.error);
