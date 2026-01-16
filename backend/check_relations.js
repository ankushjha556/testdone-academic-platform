
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const qCount = await prisma.question.count();
        const qExamCount = await prisma.questionExam.count();
        const exams = await prisma.exam.findMany();

        console.log(`TOTAL QUESTIONS: ${qCount}`);
        console.log(`TOTAL QUESTION_EXAM LINKS: ${qExamCount}`);

        const sample = await prisma.question.findFirst({
            include: {
                questionExams: {
                    include: {
                        exam: true
                    }
                },
                subject: true
            }
        });

        console.log('--- SAMPLE QUESTION ---');
        console.log(JSON.stringify(sample, null, 2));

        const publishedCount = await prisma.question.count({
            where: { status: 'PUBLISHED' }
        });
        console.log(`PUBLISHED QUESTIONS: ${publishedCount}`);

        const draftCount = await prisma.question.count({
            where: { status: 'DRAFT' } // Assuming enum
        });
        console.log(`DRAFT QUESTIONS: ${draftCount}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
