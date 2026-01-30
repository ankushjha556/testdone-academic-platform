import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkMock1Instructions() {
    const mock = await prisma.mockTest.findFirst({
        where: { slug: 'ssc-cgl-2026-tier2-mock-1' },
        select: { instructions: true }
    });
    console.log(mock?.instructions);
}
checkMock1Instructions();
