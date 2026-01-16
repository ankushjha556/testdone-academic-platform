
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const q = await prisma.question.findFirst({
            where: { questionText: { contains: "Native HTTP Verification" } },
            include: {
                questionExams: {
                    include: { exam: true }
                }
            }
        });

        if (!q) {
            console.log("Question NOT FOUND.");
            return;
        }

        console.log(`Question Found: ${q.questionText}`);
        console.log(`Linked Exams Count: ${q.questionExams.length}`);
        q.questionExams.forEach(qe => {
            console.log(` - ${qe.exam.name} (${qe.exam.slug})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
