
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DEBUG DATA ===');

    // 1. Subjects
    console.log('\n--- SUBJECTS ---');
    const subjects = await prisma.subject.findMany({
        include: { _count: { select: { questions: true } } }
    });
    console.table(subjects.map(s => ({
        name: s.name,
        slug: s.slug,
        count: s._count.questions
    })));

    // 2. Exams
    console.log('\n--- EXAMS ---');
    const exams = await prisma.exam.findMany({
        include: { _count: { select: { questionExams: true } } }
    });
    console.table(exams.map(e => ({
        name: e.name,
        slug: e.slug,
        questionCount: e._count.questionExams
    })));

    // 3. Questions Status
    console.log('\n--- QUESTION STATUS ---');
    const statusCounts = await prisma.question.groupBy({
        by: ['status'],
        _count: true
    });
    console.log(statusCounts);

    // 4. Sample Question
    console.log('\n--- SAMPLE QUESTION ---');
    const sample = await prisma.question.findFirst({
        where: { status: 'PUBLISHED' },
        include: {
            subject: true,
            questionExams: { include: { exam: true } }
        }
    });

    if (sample) {
        console.log('ID:', sample.id);
        console.log('Text:', sample.questionText.substring(0, 50) + '...');
        console.log('Subject:', sample.subject?.name, `(${sample.subject?.slug})`);
        console.log('Exams:', sample.questionExams.map(qe => qe.exam.name).join(', '));
        console.log('Status:', sample.status);
    } else {
        console.log('NO PUBLISHED QUESTIONS FOUND!');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
