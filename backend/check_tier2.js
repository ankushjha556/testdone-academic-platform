const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.mockTest.findMany({
    where: { slug: { startsWith: 'ssc-cgl-2026-tier2-mock-' } },
    select: { name: true, totalQuestions: true, accessType: true },
    orderBy: { name: 'asc' }
}).then(m => {
    console.log('Found', m.length, 'Tier-2 mocks:');
    m.forEach(x => console.log(' ', x.name, '-', x.totalQuestions, 'Qs -', x.accessType));
    p.$disconnect();
});
