/**
 * Phase 3: Content Quality Audit Script
 * 
 * SAFE AUDIT - NO MASS DELETIONS
 * This script identifies potentially problematic questions for manual review.
 * 
 * Usage: npx ts-node scripts/audit_question_quality.ts
 */

import prisma from '../src/lib/prisma';
import * as fs from 'fs';

interface QualityIssue {
    questionId: string;
    issueType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    details: string;
}

async function auditQuestionQuality() {
    console.log('🔍 Starting Question Quality Audit...');
    console.log('⚠️  This is a READ-ONLY audit. No data will be modified.\n');

    const issues: QualityIssue[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = `audit_results_${timestamp}.json`;

    // Get all published questions
    const questions = await prisma.question.findMany({
        where: { status: 'PUBLISHED' },
        select: {
            id: true,
            questionText: true,
            options: true,
            correctAnswer: true,
            solution: true,
            difficulty: true,
            subject: { select: { name: true } },
            topic: { select: { name: true } },
        },
    });

    console.log(`📊 Total published questions: ${questions.length}\n`);

    // Audit 1: Check for missing correct answers
    console.log('Checking for missing correct answers...');
    for (const q of questions) {
        if (!q.correctAnswer) {
            issues.push({
                questionId: q.id,
                issueType: 'MISSING_CORRECT_ANSWER',
                severity: 'HIGH',
                details: 'Question has no correct answer set',
            });
        }
    }

    // Audit 2: Check for empty or very short question text
    console.log('Checking for empty/short questions...');
    for (const q of questions) {
        const textLength = q.questionText?.replace(/<[^>]*>/g, '').trim().length || 0;
        if (textLength < 10) {
            issues.push({
                questionId: q.id,
                issueType: 'EMPTY_OR_SHORT_QUESTION',
                severity: 'HIGH',
                details: `Question text too short (${textLength} chars)`,
            });
        }
    }

    // Audit 3: Check for questions with less than 4 options
    console.log('Checking for insufficient options...');
    for (const q of questions) {
        const options = Array.isArray(q.options) ? q.options : [];
        if (options.length < 2) {
            issues.push({
                questionId: q.id,
                issueType: 'INSUFFICIENT_OPTIONS',
                severity: 'HIGH',
                details: `Only ${options.length} option(s) found`,
            });
        } else if (options.length < 4) {
            issues.push({
                questionId: q.id,
                issueType: 'INSUFFICIENT_OPTIONS',
                severity: 'MEDIUM',
                details: `Only ${options.length} option(s) found (expected 4)`,
            });
        }
    }

    // Audit 4: Check for missing solutions
    console.log('Checking for missing solutions...');
    let missingSolutions = 0;
    for (const q of questions) {
        const solutionLength = q.solution?.replace(/<[^>]*>/g, '').trim().length || 0;
        if (solutionLength < 10) {
            missingSolutions++;
            // Only log first 100 to avoid spam
            if (missingSolutions <= 100) {
                issues.push({
                    questionId: q.id,
                    issueType: 'MISSING_SOLUTION',
                    severity: 'LOW',
                    details: 'Solution is missing or too short',
                });
            }
        }
    }
    if (missingSolutions > 100) {
        console.log(`  ⚠️ ${missingSolutions} questions have missing solutions (showing first 100)`);
    }

    // Audit 5: Check for potential duplicates by question text similarity
    console.log('Checking for potential duplicates (sampling 1000 questions)...');
    const sampleQuestions = questions.slice(0, 1000);
    const seenTexts = new Map<string, string>();
    for (const q of sampleQuestions) {
        // Normalize text for comparison
        const normalized = q.questionText?.replace(/<[^>]*>/g, '').toLowerCase().trim().slice(0, 200) || '';
        if (normalized.length > 50) {
            if (seenTexts.has(normalized)) {
                issues.push({
                    questionId: q.id,
                    issueType: 'POTENTIAL_DUPLICATE',
                    severity: 'MEDIUM',
                    details: `Similar to question ${seenTexts.get(normalized)}`,
                });
            } else {
                seenTexts.set(normalized, q.id);
            }
        }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 AUDIT SUMMARY');
    console.log('='.repeat(50));

    const byType = issues.reduce((acc, i) => {
        acc[i.issueType] = (acc[i.issueType] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const bySeverity = issues.reduce((acc, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    console.log('\nBy Type:');
    Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
    });

    console.log('\nBy Severity:');
    console.log(`  🔴 HIGH: ${bySeverity['HIGH'] || 0}`);
    console.log(`  🟡 MEDIUM: ${bySeverity['MEDIUM'] || 0}`);
    console.log(`  🟢 LOW: ${bySeverity['LOW'] || 0}`);

    console.log(`\n📁 Total Issues Found: ${issues.length}`);

    // Save to file
    const report = {
        timestamp: new Date().toISOString(),
        totalQuestions: questions.length,
        totalIssues: issues.length,
        summary: { byType, bySeverity },
        issues: issues.slice(0, 500), // Limit to first 500 for review
    };

    fs.writeFileSync(logFile, JSON.stringify(report, null, 2));
    console.log(`\n✅ Report saved to: ${logFile}`);
    console.log('\n⚠️  IMPORTANT: Review the report before taking any action.');
    console.log('   No changes have been made to the database.\n');

    await prisma.$disconnect();
}

auditQuestionQuality().catch(console.error);
