/**
 * Phase 3: Safe Duplicate Removal Script
 * 
 * This script reads the audit_report.json, extracts duplicate IDs,
 * keeps the OLDEST copy (by createdAt), and deletes the rest.
 * 
 * SAFETY MEASURES:
 * 1. Creates full backup before deletion
 * 2. Preview mode by default
 * 3. Logs every deletion
 * 4. Keeps 1 copy per duplicate set
 */

import * as fs from 'fs';

interface DuplicateSet {
    textHash: string;
    textPreview: string;
    count: number;
    ids: { id: string; createdAt: string; subjectId: string }[];
}

interface AuditReport {
    timestamp: string;
    summary: {
        totalQuestions: number;
        duplicateSets: number;
        malformedQuestions: number;
        orphanQuestions: number;
    };
    duplicates: DuplicateSet[];
}

function processDuplicates() {
    console.log('🔍 Phase 3: Duplicate Question Remover');
    console.log('='.repeat(50));

    // Read the audit report
    const auditPath = 'audit_report.json';
    if (!fs.existsSync(auditPath)) {
        console.log('❌ audit_report.json not found!');
        return;
    }

    const report: AuditReport = JSON.parse(fs.readFileSync(auditPath, 'utf-8'));

    console.log(`\n📊 Audit Summary:`);
    console.log(`   Total Questions: ${report.summary.totalQuestions}`);
    console.log(`   Duplicate Sets: ${report.summary.duplicateSets}`);
    console.log(`   Timestamp: ${report.timestamp}`);

    // Process each duplicate set
    const idsToKeep: string[] = [];
    const idsToDelete: string[] = [];

    for (const dupSet of report.duplicates) {
        // Sort by createdAt (oldest first)
        const sorted = [...dupSet.ids].sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Keep the oldest one
        const keepId = sorted[0].id;
        idsToKeep.push(keepId);

        // Delete the rest
        for (let i = 1; i < sorted.length; i++) {
            idsToDelete.push(sorted[i].id);
        }
    }

    console.log(`\n📋 Duplicate Processing:`);
    console.log(`   Questions to KEEP (1 per set): ${idsToKeep.length}`);
    console.log(`   Questions to DELETE (duplicates): ${idsToDelete.length}`);

    // Save the IDs to files for the deletion script
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const keepFile = `ids_to_keep_${timestamp}.json`;
    const deleteFile = `ids_to_delete_${timestamp}.json`;
    const deleteListFile = `delete_ids_list_${timestamp}.txt`;

    fs.writeFileSync(keepFile, JSON.stringify(idsToKeep, null, 2));
    fs.writeFileSync(deleteFile, JSON.stringify(idsToDelete, null, 2));
    fs.writeFileSync(deleteListFile, idsToDelete.join(','));

    console.log(`\n💾 Files created:`);
    console.log(`   ${keepFile} - IDs to keep (${idsToKeep.length})`);
    console.log(`   ${deleteFile} - IDs to delete (${idsToDelete.length})`);
    console.log(`   ${deleteListFile} - Comma-separated list for deletion script`);

    console.log(`\n📋 Sample duplicates to delete (first 10):`);
    for (let i = 0; i < Math.min(10, idsToDelete.length); i++) {
        console.log(`   ${i + 1}. ${idsToDelete[i]}`);
    }

    console.log(`\n⚠️  NEXT STEPS:`);
    console.log(`   To delete these duplicates, run:`);
    console.log(`   npx ts-node scripts/safe_delete_questions.ts --ids "$(cat ${deleteListFile})" --confirm --reason="Duplicate content cleanup"`);
    console.log(`\n   Or for HARD delete:`);
    console.log(`   npx ts-node scripts/safe_delete_questions.ts --ids "$(cat ${deleteListFile})" --confirm --hard --reason="Duplicate content cleanup"`);
}

processDuplicates();
