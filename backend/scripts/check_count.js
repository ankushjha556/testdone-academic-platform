const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
    const count = await p.question.count();
    console.log('Question count:', count);
    const published = await p.question.count({ where: { status: 'PUBLISHED' } });
    console.log('Published:', published);
}
main().finally(() => p.$disconnect());
