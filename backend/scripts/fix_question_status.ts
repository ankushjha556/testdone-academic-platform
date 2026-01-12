
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing Question Status...');

    // Update questions where status is DRAFT (default) or null (if applicable, though schema says default DRAFT)
    // The previous error suggested status might be null in my query, but schema says @default(DRAFT).
    // Let's update all DRAFT questions to PUBLISHED.

    const result = await prisma.question.updateMany({
        where: {
            status: 'DRAFT'
        },
        data: {
            status: 'PUBLISHED'
        }
    });

    console.log(`✅ Updated ${result.count} questions from DRAFT to PUBLISHED status.`);

    const totalPublished = await prisma.question.count({
        where: {
            status: 'PUBLISHED'
        }
    });

    console.log(`📊 Total PUBLISHED questions in DB: ${totalPublished}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
