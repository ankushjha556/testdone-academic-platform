const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Data Integrity...');

    // 1. Check Exams
    console.log('\n--- EXAMS ---');
    const exams = await prisma.exam.findMany();
    console.log(`Found ${exams.length} exams.`);
    exams.forEach(e => {
        console.log(`[${e.status}] ${e.name} (slug: ${e.slug}, id: ${e.id})`);
    });

    // 2. Check Questions with multiple exams
    console.log('\n--- QUESTIONS (Sample with Exam links) ---');
    const questions = await prisma.question.findMany({
        take: 5,
        where: {
            questionExams: {
                some: {} // Only ones with exams
            }
        },
        include: {
            questionExams: {
                include: { exam: true }
            }
        }
    });

    if (questions.length === 0) {
        console.log('⚠️ No questions found with linked exams!');
    } else {
        questions.forEach(q => {
            const examNames = q.questionExams.map(qe => qe.exam.name).join(', ');
            console.log(`[${q.status}] ${q.questionText.substring(0, 30)}... -> Exams: [${examNames}]`);
        });
    }

    // 3. Check for "RRB" specific questions
    console.log('\n--- RRB Questions Check ---');
    const rrbQuestions = await prisma.question.findMany({
        where: {
            questionExams: {
                some: {
                    exam: {
                        slug: { contains: 'rrb' } // Loose check
                    }
                }
            }
        },
        take: 3
    });
    console.log(`Found ${rrbQuestions.length} RRB-related questions.`);

    // 4. Distribution Check
    console.log('\n--- QUESTION DISTRIBUTION BY EXAM ---');
    const allExams = await prisma.exam.findMany({
        include: {
            _count: {
                select: { questionExams: true }
            }
        }
    });
    allExams.forEach(e => {
        if (e._count.questionExams > 0) {
            console.log(`[${e.name}]: ${e._count.questionExams} questions`);
        }
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
