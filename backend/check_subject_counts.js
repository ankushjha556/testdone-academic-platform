
const prisma = require('./dist/lib/prisma').default;

async function main() {
    try {
        const questions = await prisma.question.groupBy({
            by: ['topicId'],
            _count: {
                id: true,
            },
        });

        // We need to fetch subject names because groupBy only gives IDs or we can join if we use raw query
        // Let's use a simpler approach: fetch all subjects and count
        const subjects = await prisma.subject.findMany({
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });

        // console.log('--- Subject Question Counts ---');
        // subjects.forEach(s => {
        //     console.log(`${s.name} (${s.slug}): ${s._count.questions}`);
        // });
        // console.log('-------------------------------');
        console.log(JSON.stringify(subjects.map(s => ({
            name: s.name,
            slug: s.slug,
            count: s._count.questions
        })), null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
