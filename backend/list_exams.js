
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const exams = await prisma.exam.findMany({
        select: { id: true, name: true, slug: true }
    });
    console.log('--- EXAMS IN DB ---');
    console.table(exams);

    const categories = await prisma.examCategory.findMany();
    console.log('--- CATEGORIES IN DB ---');
    console.table(categories);
}

main().finally(() => prisma.$disconnect());
