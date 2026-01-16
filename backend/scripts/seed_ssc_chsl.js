
const { PrismaClient, ContentStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Missing Exams...");
    const sscCat = await prisma.examCategory.findFirst({ where: { slug: 'ssc' } });
    if (!sscCat) {
        console.error("SSC Category not found!");
        return;
    }

    const exams = [
        {
            name: 'SSC CHSL',
            slug: 'ssc-chsl',
            fullName: 'Combined Higher Secondary Level',
            description: 'SSC CHSL for LDC, PA, SA and DEO posts.',
            status: ContentStatus.PUBLISHED,
            categoryId: sscCat.id,
            eligibility: '12th Pass',
            conductingBody: 'SSC'
        }
    ];

    for (const e of exams) {
        const res = await prisma.exam.upsert({
            where: { slug: e.slug },
            update: e,
            create: e
        });
        console.log(`Upserted: ${res.name} (${res.slug})`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
