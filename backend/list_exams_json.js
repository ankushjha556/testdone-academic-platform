
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const exams = await prisma.exam.findMany({
        select: { name: true, slug: true }
    });
    console.log('--- EXAMS ---');
    console.log(JSON.stringify(exams, null, 2));

    const categories = await prisma.examCategory.findMany({
        select: { name: true, slug: true }
    });
    console.log('--- CATEGORIES ---');
    console.log(JSON.stringify(categories, null, 2));
}

main().finally(() => prisma.$disconnect());
