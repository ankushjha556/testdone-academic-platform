
const prisma = require('./dist/lib/prisma').default;

async function main() {
    try {
        const subjects = await prisma.subject.findMany({
            include: {
                _count: {
                    select: { questions: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log('SUBJECT_DISTRIBUTION_START');
        subjects.forEach(s => {
            // align output for readability
            console.log(`${s.name} [${s.slug}]: ${s._count.questions}`);
        });
        console.log('SUBJECT_DISTRIBUTION_END');

        const total = await prisma.question.count();
        console.log(`TOTAL_QUESTIONS_IN_DB: ${total}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
