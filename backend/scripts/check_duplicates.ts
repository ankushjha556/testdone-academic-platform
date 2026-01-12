
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== DUPLICATE CHECK ===');

    const duplicates = await prisma.$queryRaw`
        SELECT "questionText", COUNT(*) as count
        FROM "Question"
        GROUP BY "questionText"
        HAVING COUNT(*) > 1
    `;

    console.log(`Found ${(duplicates as any[]).length} duplicated question texts.`);

    if ((duplicates as any[]).length > 0) {
        console.log('Sample duplicates:', (duplicates as any[]).slice(0, 3));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
