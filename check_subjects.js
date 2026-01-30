const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find subjects containing our canonical names
    const subjects = await prisma.subject.findMany({
        where: {
            OR: [
                { name: { contains: 'Quantitative' } },
                { name: { contains: 'Reasoning' } },
                { name: { contains: 'English' } },
                { name: { contains: 'General' } },
                { name: { contains: 'Awareness' } }
            ]
        },
        select: {
            name: true,
            slug: true,
            _count: { select: { questions: true } }
        },
        orderBy: { questions: { _count: 'desc' } }
    });

    console.log('=== CANONICAL SUBJECTS ===');
    subjects.forEach(s => {
        console.log(`Name: "${s.name}" | Slug: "${s.slug}" | Questions: ${s._count.questions}`);
    });
}

main().finally(() => prisma.$disconnect());
