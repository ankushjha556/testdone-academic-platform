const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const exam = await prisma.exam.upsert({
        where: { slug: 'ssc-mts' },
        update: {},
        create: {
            name: 'SSC MTS',
            slug: 'ssc-mts',
            categoryId: (await prisma.examCategory.findFirst()).id, // Default to first category
            status: 'PUBLISHED'
        }
    });
    console.log(`Upserted Exam: ${exam.name}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
