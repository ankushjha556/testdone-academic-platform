
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditData() {
    console.log('🔍 Auditing Database for Normalization...');

    // 1. Check Exams
    const exams = await prisma.exam.findMany({
        include: {
            _count: {
                select: { questionExams: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    console.log(`\n📋 Exams Found (${exams.length}):`);
    exams.forEach(e => {
        console.log(`  - "${e.name}" (Slug: ${e.slug}) -> Questions: ${e._count.questionExams}`);
    });

    // 2. Check Subjects
    const subjects = await prisma.subject.findMany({
        include: {
            _count: {
                select: { questions: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    console.log(`\n📚 Subjects Found (${subjects.length}):`);
    subjects.forEach(s => {
        console.log(`  - "${s.name}" (Slug: ${s.slug}) -> Questions: ${s._count.questions}`);
    });

    // 3. Check for potential duplicates (fuzzy matching)
    console.log('\n⚠️ Potential Exam Duplicates:');
    for (let i = 0; i < exams.length; i++) {
        for (let j = i + 1; j < exams.length; j++) {
            if (exams[i].name.toLowerCase() === exams[j].name.toLowerCase() ||
                exams[i].slug.replace(/-/g, '') === exams[j].slug.replace(/-/g, '')) {
                console.log(`  - "${exams[i].name}" vs "${exams[j].name}"`);
            }
        }
    }

    console.log('\n⚠️ Potential Subject Duplicates:');
    for (let i = 0; i < subjects.length; i++) {
        for (let j = i + 1; j < subjects.length; j++) {
            if (subjects[i].name.toLowerCase() === subjects[j].name.toLowerCase() ||
                subjects[i].slug.replace(/-/g, '') === subjects[j].slug.replace(/-/g, '')) {
                console.log(`  - "${subjects[i].name}" vs "${subjects[j].name}"`);
            }
        }
    }
}

auditData()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
