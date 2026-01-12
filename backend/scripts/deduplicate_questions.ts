
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DEDUPLICATING QUESTIONS ===');

    // Get all duplicate texts
    const duplicates = await prisma.$queryRaw<{ questionText: string, count: bigint }[]>`
        SELECT "questionText", COUNT(*) as count
        FROM "Question"
        GROUP BY "questionText"
        HAVING COUNT(*) > 1
    `;

    console.log(`Found ${duplicates.length} question texts with duplicates.`);

    let deletedCount = 0;

    for (const dup of duplicates) {
        // Find all records for this text
        const records = await prisma.question.findMany({
            where: { questionText: dup.questionText },
            orderBy: { createdAt: 'desc' }, // Keep latest
            select: { id: true }
        });

        // Keep the first one (latest), delete the rest
        const toDelete = records.slice(1).map(r => r.id);

        if (toDelete.length > 0) {
            await prisma.question.deleteMany({
                where: { id: { in: toDelete } }
            });
            deletedCount += toDelete.length;
        }
    }

    console.log(`✅ Deleted ${deletedCount} duplicate questions.`);

    const remaining = await prisma.question.count();
    console.log(`📊 Remaining Questions: ${remaining}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
