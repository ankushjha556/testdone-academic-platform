
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    console.log('🔍 VERIFYING DATA NORMALIZATION');

    // 1. Check Total Count
    const total = await prisma.question.count();
    console.log(`\n✅ Total Questions: ${total} (Expected: 152306)`);

    // 2. Check Merged Subjects
    const checks = [
        { name: 'Quantitative Aptitude', aliases: ['Aptitude', 'Quant'] },
        { name: 'Reasoning Ability', aliases: ['Reasoning', 'General Intelligence & Reasoning'] },
        { name: 'English Language', aliases: ['English', 'Vocabulary'] },
        { name: 'General Awareness', aliases: ['General Studies', 'Knowledge'] },
        { name: 'Computer Awareness', aliases: ['Computer', 'Technology'] }
    ];

    for (const check of checks) {
        console.log(`\nChecking "${check.name}"...`);
        const target = await prisma.subject.findFirst({ where: { name: check.name } });
        if (!target) {
            console.log(`❌ Target subject "${check.name}" NOT FOUND!`);
            continue;
        }
        const targetCount = await prisma.question.count({ where: { subjectId: target.id } });
        console.log(`  Target Count: ${targetCount}`);

        for (const alias of check.aliases) {
            const source = await prisma.subject.findFirst({ where: { name: alias } });
            if (source) {
                const sourceCount = await prisma.question.count({ where: { subjectId: source.id } });
                console.log(`  Alias "${alias}" Count: ${sourceCount} (Should be 0)`);
            } else {
                console.log(`  Alias "${alias}" not present (OK)`);
            }
        }
    }
}

verify()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
