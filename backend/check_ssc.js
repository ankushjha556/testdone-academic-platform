
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const exam = await prisma.exam.findUnique({
            where: { slug: 'ssc-chsl' },
            include: {
                _count: {
                    select: { questionExams: true }
                }
            }
        });
        console.log("EXAM DATA:", JSON.stringify(exam, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
