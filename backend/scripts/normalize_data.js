
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');

// Normalization Rules (Target Canonical Name -> Array of Source Names/Slugs to Merge)
const SUBJECT_MAPPINGS = {
    'Quantitative Aptitude': ['Aptitude', 'Quant', 'IBPS Quant', 'Mathematics', 'Maths', 'Numerical Ability'],
    'Reasoning Ability': ['Reasoning', 'General Intelligence', 'General Intelligence & Reasoning', 'Logical Reasoning', 'Mental Ability'],
    'English Language': ['English', 'General English', 'English Comprehension', 'Vocabulary', 'Verbal Ability'],
    'General Awareness': ['General Knowledge', 'GK', 'General Studies', 'Awareness', 'Knowledge', 'Studies', 'Current Affairs', 'Static GK'],
    'Computer Awareness': ['Computer', 'Computer Knowledge', 'Computer Science', 'Technology', 'Digital Literacy'],
    'General Science': ['Science', 'Physics', 'Chemistry', 'Biology', 'Science &'],
    'Environment & Ecology': ['Environment', 'Ecology', 'Environment & General']
};

const EXAM_MAPPINGS = {
    'SSC CGL': ['SSC', 'SSC CGL Tier-I', 'SSC CGL Tier-1'],
    'RRB NTPC': ['RRB', 'Railway NTPC', 'Railways'],
    'IBPS PO': ['IBPS', 'Bank PO'],
    'UPSC CSE': ['UPSC', 'Civil Services']
};

async function normalizeSubjects() {
    console.log('\n🔄 Normalizing Subjects...');

    for (const [targetName, sourceNames] of Object.entries(SUBJECT_MAPPINGS)) {
        console.log(`\nTARGET: "${targetName}"`);

        // 1. Find or Create Target
        let target = await prisma.subject.findFirst({
            where: {
                OR: [
                    { name: { equals: targetName, mode: 'insensitive' } },
                    { slug: targetName.toLowerCase().replace(/ /g, '-') }
                ]
            }
        });

        if (!target) {
            console.log(`  ✨ Creating missing target subject: ${targetName}`);
            if (!DRY_RUN) {
                target = await prisma.subject.create({
                    data: {
                        name: targetName,
                        slug: targetName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                    }
                });
            } else {
                console.log(`  [DRY RUN] Would create subject ${targetName}`);
                continue; // Cannot proceed without ID in dry run
            }
        }

        if (DRY_RUN && !target) {
            console.log(`  Target ID: PENDING_CREATION`);
        } else {
            console.log(`  Target ID: ${target.id} (${target.name})`);
        }

        // 2. Find Sources
        const sources = await prisma.subject.findMany({
            where: {
                name: { in: sourceNames, mode: 'insensitive' },
                id: { not: target ? target.id : undefined } // Exclude target itself
            },
            include: {
                _count: { select: { questions: true } }
            }
        });

        if (sources.length === 0) {
            console.log(`  No fragmentation found for sources: ${sourceNames.join(', ')}`);
            continue;
        }

        // 3. Move Questions
        let totalMoved = 0;
        for (const source of sources) {
            const count = source._count.questions;
            if (count > 0) {
                console.log(`  Found alias "${source.name}" with ${count} questions.`);

                if (!DRY_RUN) {
                    const result = await prisma.question.updateMany({
                        where: { subjectId: source.id },
                        data: { subjectId: target.id }
                    });
                    console.log(`  ✅ Moved ${result.count} questions from "${source.name}" to "${targetName}"`);
                    totalMoved += result.count;
                } else {
                    console.log(`  [DRY RUN] Would move ${count} questions from "${source.name}" to "${targetName}"`);
                    totalMoved += count;
                }
            } else {
                console.log(`  Alias "${source.name}" is empty. Skipping.`);
            }
        }

        console.log(`  Summary: ~${totalMoved} questions normalized to "${targetName}"`);
    }
}

async function normalizeExams() {
    console.log('\n🔄 Normalizing Exams...');

    for (const [targetName, sourceNames] of Object.entries(EXAM_MAPPINGS)) {
        console.log(`\nTARGET: "${targetName}"`);

        let target = await prisma.exam.findFirst({
            where: {
                OR: [
                    { name: { equals: targetName, mode: 'insensitive' } },
                    { slug: targetName.toLowerCase().replace(/ /g, '-') }
                ]
            }
        });

        if (!target) {
            // If target doesn't exist, we skip exam merging to be safe, or create?
            // User said "Update examId -> canonical examId (minor fixes only)"
            // Let's assume we only merge into existing.
            console.log(`  ⚠️ Target exam "${targetName}" not found. Skipping merge for safety.`);
            continue;
        }

        console.log(`  Target ID: ${target.id} (${target.name})`);

        const sources = await prisma.exam.findMany({
            where: {
                name: { in: sourceNames, mode: 'insensitive' },
                id: { not: target.id }
            },
            include: {
                _count: { select: { questionExams: true } }
            }
        });

        for (const source of sources) {
            const count = source._count.questionExams;
            if (count > 0) {
                console.log(`  Found alias "${source.name}" with ${count} linked questions.`);

                if (!DRY_RUN) {
                    // Update QuestionExam join table
                    // We need to be careful not to create duplicate primary keys if a question is already linked to target
                    // 1. Get all Q-IDs linked to source
                    const qLinks = await prisma.questionExam.findMany({
                        where: { examId: source.id },
                        select: { questionId: true }
                    });

                    let moved = 0;
                    let skipped = 0;

                    for (const link of qLinks) {
                        // Check if already linked to target
                        const exists = await prisma.questionExam.findUnique({
                            where: {
                                questionId_examId: {
                                    questionId: link.questionId,
                                    examId: target.id
                                }
                            }
                        });

                        if (!exists) {
                            // Update the examId to target
                            await prisma.questionExam.update({
                                where: {
                                    questionId_examId: {
                                        questionId: link.questionId,
                                        examId: source.id
                                    }
                                },
                                data: { examId: target.id }
                            });
                            moved++;
                        } else {
                            // Already exists, just delete the old link (redundant) or keep it? 
                            // User said ZERO DELETION.
                            // But strict unique constraint on (questionId, examId) prevents doubles.
                            // We can't update if it causes conflict.
                            // If we can't update, and we can't delete... 
                            // We effectively leave it as is? But then it's still linked to 'SSC' alias.
                            // Exception: "Allowed operations... RE-MAP relations"
                            // If I have Q1 linked to 'SSC' and 'SSC CGL'. 'SSC' is alias for 'SSC CGL'.
                            // I should remove the link to 'SSC' because it's redundant.
                            // Is that deletion? technically yes. But it's cleaning redundancy.
                            // The user said "Old subject records may remain with 0 questions".
                            // This implies we can empty the relations.
                            // However, strictly complying to "NO DELETE FROM", I can't delete the QuestionExam row?
                            // Wait, "Allowed operations ONLY: UPDATE... RE-MAP... NORMALIZE... ADD".
                            // If relation exists for target, we basically "merged" it already.
                            // So we can perhaps leave the old relation? 
                            // But then filters showing "SSC" will still show questions.
                            // User wants deterministic filters.
                            // I will skip merging where target link already exists.
                            skipped++;
                        }
                    }
                    console.log(`  ✅ Remapped ${moved} links, skipped ${skipped} (already linked)`);
                } else {
                    console.log(`  [DRY RUN] Would remap ${count} links`);
                }
            }
        }
    }
}

async function main() {
    console.log('🚀 DATA NORMALIZATION SCRIPT');
    console.log('============================');
    if (DRY_RUN) {
        console.log('⚠️  RUNNING IN DRY-RUN MODE (No changes will be applied)');
    } else {
        console.log('⚠️  RUNNING IN PRODUCTION MODE (Changes WILL be applied)');
    }

    // Count before
    const countBefore = await prisma.question.count();
    console.log(`\nTotal Questions Before: ${countBefore}`);

    await normalizeSubjects();
    await normalizeExams();

    // Count after
    const countAfter = await prisma.question.count();
    console.log(`\nTotal Questions After: ${countAfter}`);

    if (countBefore !== countAfter) {
        console.error(`\n❌ FATAL ERROR: Question count mismatch! ${countBefore} -> ${countAfter}`);
    } else {
        console.log(`\n✅ Integrity Check Passed: Count remains ${countAfter}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
