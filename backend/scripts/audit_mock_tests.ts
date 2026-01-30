// Audit script to investigate mock test data issues
// Run with: npx tsx scripts/audit_mock_tests.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function auditMockTests() {
    console.log('=== Mock Test Audit ===\n');

    // Get all Tier-2 mocks
    const tier2Mocks = await prisma.mockTest.findMany({
        where: {
            slug: { startsWith: 'ssc-cgl-2026-tier2-mock-' }
        },
        include: {
            _count: {
                select: { testQuestions: true }
            }
        },
        orderBy: { name: 'asc' }
    });

    console.log(`Found ${tier2Mocks.length} Tier-2 mocks:\n`);

    for (const mock of tier2Mocks) {
        const mockNum = mock.name.match(/Mock Test (\d+)/)?.[1] || '?';

        // Parse sections JSON
        let sectionsInfo = 'No sections';
        if (mock.sections) {
            const sections = mock.sections as any[];
            if (Array.isArray(sections)) {
                sectionsInfo = sections.map((s: any) => `${s.name}(${s.questionsCount}Qs)`).join(', ');
            }
        }

        // Get question count per section
        const sectionCounts = await prisma.testQuestion.groupBy({
            by: ['sectionIndex'],
            where: { testId: mock.id },
            _count: { id: true },
            orderBy: { sectionIndex: 'asc' }
        });

        const sectionDistribution = sectionCounts.map(s => `S${s.sectionIndex}:${s._count.id}`).join(', ');

        console.log(`Mock ${mockNum}:`);
        console.log(`  Total Questions: ${mock._count.testQuestions}`);
        console.log(`  Duration: ${mock.durationMinutes} mins`);
        console.log(`  Total Marks: ${mock.totalMarks}`);
        console.log(`  Access: ${mock.accessType}`);
        console.log(`  Status: ${mock.status}`);
        console.log(`  Sections JSON: ${sectionsInfo}`);
        console.log(`  Question Distribution: ${sectionDistribution || 'None'}`);
        console.log('');
    }

    // Check for mocks with 0 duration (auto-submit issue)
    const zeroDuration = tier2Mocks.filter(m => m.durationMinutes === 0);
    if (zeroDuration.length > 0) {
        console.log('\n⚠️ MOCKS WITH 0 DURATION (may auto-submit):');
        zeroDuration.forEach(m => console.log(`  - ${m.name}`));
    }

    // Check for mocks with missing sections
    const missingSections = tier2Mocks.filter(m => !m.sections || (Array.isArray(m.sections) && m.sections.length === 0));
    if (missingSections.length > 0) {
        console.log('\n⚠️ MOCKS WITH MISSING SECTIONS JSON:');
        missingSections.forEach(m => console.log(`  - ${m.name}`));
    }

    // Check for mocks with low question count
    const lowQuestions = tier2Mocks.filter(m => m._count.testQuestions < 100);
    if (lowQuestions.length > 0) {
        console.log('\n⚠️ MOCKS WITH LOW QUESTION COUNT (<100):');
        lowQuestions.forEach(m => console.log(`  - ${m.name}: ${m._count.testQuestions} questions`));
    }

    await prisma.$disconnect();
}

auditMockTests().catch(console.error);
