/**
 * Phase 3: Safe Question Deletion Script
 * 
 * SAFETY MEASURES:
 * 1. Every deletion is logged to a file with full question data
 * 2. Requires explicit --confirm flag to actually delete
 * 3. Soft-delete by default (marks ARCHIVED, not physical delete)
 * 4. Creates backup JSON before any changes
 * 
 * Usage:
 *   npx ts-node scripts/safe_delete_questions.ts --ids "id1,id2,id3"           # Preview only
 *   npx ts-node scripts/safe_delete_questions.ts --ids "id1,id2,id3" --confirm # Actually delete
 *   npx ts-node scripts/safe_delete_questions.ts --ids "id1,id2,id3" --hard    # Physical delete (DANGEROUS)
 */

import prisma from '../src/lib/prisma';
import * as fs from 'fs';

interface DeletedQuestion {
    id: string;
    questionText: string;
    subject: string | null;
    topic: string | null;
    difficulty: string;
    correctAnswer: string;
    options: any;
    solution: string | null;
    deletedAt: string;
    deletedBy: string;
    reason: string;
}

async function safeDeleteQuestions() {
    const args = process.argv.slice(2);

    // Parse arguments
    const idsArg = args.find(a => a.startsWith('--ids'));
    const idsIndex = args.indexOf('--ids');
    const ids = idsIndex >= 0 && args[idsIndex + 1]
        ? args[idsIndex + 1].split(',').map(id => id.trim())
        : [];

    const isConfirmed = args.includes('--confirm');
    const isHardDelete = args.includes('--hard');
    const reason = args.find(a => a.startsWith('--reason='))?.replace('--reason=', '') || 'Quality control cleanup';

    if (ids.length === 0) {
        console.log('📋 Safe Question Deletion Script');
        console.log('================================');
        console.log('Usage:');
        console.log('  npx ts-node scripts/safe_delete_questions.ts --ids "id1,id2,id3"');
        console.log('  npx ts-node scripts/safe_delete_questions.ts --ids "id1,id2,id3" --confirm');
        console.log('  npx ts-node scripts/safe_delete_questions.ts --ids "id1,id2,id3" --reason="Duplicate content"');
        console.log('\nFlags:');
        console.log('  --ids      Comma-separated list of question IDs to delete');
        console.log('  --confirm  Actually perform the deletion (otherwise preview only)');
        console.log('  --hard     Physical delete instead of soft-delete (DANGEROUS)');
        console.log('  --reason   Reason for deletion (logged)');
        process.exit(0);
    }

    console.log('\n🔍 Safe Question Deletion Script');
    console.log('='.repeat(50));
    console.log(`Mode: ${isConfirmed ? (isHardDelete ? '⚠️  HARD DELETE' : '🗄️  SOFT DELETE (Archive)') : '👁️  PREVIEW ONLY'}`);
    console.log(`Questions to process: ${ids.length}`);
    console.log(`Reason: ${reason}\n`);

    // Fetch questions first
    const questions = await prisma.question.findMany({
        where: { id: { in: ids } },
        include: {
            subject: { select: { name: true } },
            topic: { select: { name: true } },
        }
    });

    if (questions.length === 0) {
        console.log('❌ No questions found with the provided IDs.');
        await prisma.$disconnect();
        return;
    }

    console.log(`Found ${questions.length} questions:\n`);

    // Display questions
    const deletionLog: DeletedQuestion[] = [];
    for (const q of questions) {
        const preview = q.questionText?.replace(/<[^>]*>/g, '').substring(0, 100);
        console.log(`  📝 ID: ${q.id}`);
        console.log(`     Subject: ${q.subject?.name || 'Unknown'}`);
        console.log(`     Difficulty: ${q.difficulty}`);
        console.log(`     Preview: ${preview}...`);
        console.log('');

        deletionLog.push({
            id: q.id,
            questionText: q.questionText,
            subject: q.subject?.name || null,
            topic: q.topic?.name || null,
            difficulty: q.difficulty,
            correctAnswer: q.correctAnswer,
            options: q.options,
            solution: q.solution,
            deletedAt: new Date().toISOString(),
            deletedBy: 'Phase3_QualityControl',
            reason: reason,
        });
    }

    // Save backup log
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `deleted_questions_backup_${timestamp}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(deletionLog, null, 2));
    console.log(`💾 Backup saved to: ${backupFile}`);

    if (!isConfirmed) {
        console.log('\n⚠️  PREVIEW MODE - No changes made.');
        console.log('   Add --confirm flag to actually delete these questions.');
        await prisma.$disconnect();
        return;
    }

    // Perform deletion
    console.log('\n🗑️  Performing deletion...');

    if (isHardDelete) {
        console.log('⚠️  HARD DELETE - Physically removing from database...');
        // Must delete related records first due to foreign keys
        await prisma.userMistakeLog.deleteMany({ where: { questionId: { in: ids } } });
        await prisma.questionExam.deleteMany({ where: { questionId: { in: ids } } });
        await prisma.testQuestion.deleteMany({ where: { questionId: { in: ids } } });
        await prisma.bookmark.deleteMany({ where: { questionId: { in: ids } } });

        const result = await prisma.question.deleteMany({
            where: { id: { in: ids } }
        });
        console.log(`✅ Hard deleted ${result.count} questions.`);
    } else {
        // Soft delete - mark as ARCHIVED
        const result = await prisma.question.updateMany({
            where: { id: { in: ids } },
            data: { status: 'ARCHIVED' }
        });
        console.log(`✅ Soft deleted (archived) ${result.count} questions.`);
    }

    console.log(`\n📁 Full backup available at: ${backupFile}`);
    console.log('   This backup contains all question data for potential restoration.\n');

    await prisma.$disconnect();
}

safeDeleteQuestions().catch(console.error);
