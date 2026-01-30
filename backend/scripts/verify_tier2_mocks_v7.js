const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    const mocks = await prisma.mockTest.findMany({
        where: { slug: { startsWith: 'ssc-cgl-2026-tier2-mock-' } },
        include: { _count: { select: { testQuestions: true } } },
        orderBy: { name: 'asc' }
    });

    console.log('\n=== SSC CGL Tier-2 Mock Tests Verification ===');
    console.log('Total Tier-2 Mocks:', mocks.length);
    console.log('\nBreakdown:');

    let totalQuestions = 0;
    for (const m of mocks) {
        console.log(`  - ${m.name}: ${m._count.testQuestions} questions (${m.accessType})`);
        totalQuestions += m._count.testQuestions;
    }

    console.log('\nTotal Questions:', totalQuestions);

    // Check all are PREMIUM
    const premiumCount = mocks.filter(m => m.accessType === 'PREMIUM').length;
    console.log(`\nPremium Access: ${premiumCount}/${mocks.length}`);

    if (premiumCount === mocks.length && mocks.length === 15) {
        console.log('\n✅ All 15 Tier-2 mocks are correctly set as PREMIUM');
    } else if (mocks.length < 15) {
        console.log(`\n⚠️ Only ${mocks.length}/15 mocks found`);
    }

    await prisma.$disconnect();
}

verify();
