const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- DB CHECK ---');
        console.log('DB URL:', process.env.DATABASE_URL ? 'FOUND' : 'MISSING');
        const userCount = await prisma.user.count();
        console.log(`Users: ${userCount}`);

        const examCount = await prisma.exam.count();
        console.log(`Exams: ${examCount}`);

        const categoryCount = await prisma.examCategory.count();
        console.log(`Categories: ${categoryCount}`);

        const subjectCount = await prisma.subject.count();
        console.log(`Subjects: ${subjectCount}`);

        console.log('--- END DB CHECK ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
