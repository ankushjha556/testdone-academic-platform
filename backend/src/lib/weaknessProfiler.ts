/**
 * Weakness Profiler Service
 * 
 * Calculates and stores user weakness profiles based on UserMistakeLog data.
 * Generates UserWeaknessSnapshot which is a derived, rebuildable analytics table.
 * 
 * This service provides:
 * - Subject-wise accuracy calculation
 * - Topic-wise accuracy calculation
 * - Difficulty-wise breakdown
 * - Improvement tracking over time
 */

import prisma from './prisma';
import { isFeatureEnabled } from './featureFlags';
import { MistakeSource } from '@prisma/client';

// Source weights for mistake intelligence
// Higher weight = more significant data for determining user weakness
const SOURCE_WEIGHTS: Record<MistakeSource, number> = {
    MOCK_TEST: 1.0,        // Exam simulation - highest signal
    SMART_PRACTICE: 0.8,   // Targeted practice - high signal
    QUESTION_BANK: 0.5,    // Exploration practice - lower signal
};

interface SubjectWeakness {
    subjectId: string;
    name: string;
    accuracy: number;
    totalQuestions: number;
    correctCount: number;
    errorCount: number;
    trend: 'improving' | 'declining' | 'stable';
}

interface TopicWeakness {
    topicId: string;
    name: string;
    subjectId: string;
    subjectName: string;
    accuracy: number;
    totalQuestions: number;
    errorCount: number;
}

interface DifficultyWeakness {
    difficulty: string;
    accuracy: number;
    totalQuestions: number;
    errorCount: number;
}

/**
 * Calculate and store weakness snapshot for a user
 * This is designed to be called asynchronously after test completion
 */
export async function refreshWeaknessSnapshot(userId: string): Promise<void> {
    if (!isFeatureEnabled('mistakeIntelligence')) {
        return;
    }

    console.log(`[WeaknessProfiler] Refreshing snapshot for user ${userId}`);

    try {
        // Get all mistake logs for user
        const mistakeLogs = await prisma.userMistakeLog.findMany({
            where: { userId },
            include: {
                question: {
                    select: {
                        subject: { select: { id: true, name: true } },
                        topic: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (mistakeLogs.length === 0) {
            console.log(`[WeaknessProfiler] No data for user ${userId}`);
            return;
        }

        // Calculate subject-wise stats
        const subjectStats = new Map<string, {
            subjectId: string;
            name: string;
            correct: number;
            total: number;
            recentCorrect: number;
            recentTotal: number;
        }>();

        // Calculate topic-wise stats
        const topicStats = new Map<string, {
            topicId: string;
            name: string;
            subjectId: string;
            subjectName: string;
            correct: number;
            total: number;
        }>();

        // Calculate difficulty-wise stats
        const difficultyStats = new Map<string, { correct: number; total: number }>();

        // Date threshold for "recent" (last 7 days)
        const recentThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const log of mistakeLogs) {
            const subjectId = log.question.subject.id;
            const subjectName = log.question.subject.name;
            const topicId = log.question.topic?.id;
            const topicName = log.question.topic?.name;
            const difficulty = log.difficulty;

            // Subject stats
            if (!subjectStats.has(subjectId)) {
                subjectStats.set(subjectId, {
                    subjectId,
                    name: subjectName,
                    correct: 0,
                    total: 0,
                    recentCorrect: 0,
                    recentTotal: 0,
                });
            }
            const subjStat = subjectStats.get(subjectId)!;
            subjStat.total++;
            if (log.isCorrect) subjStat.correct++;
            if (log.createdAt >= recentThreshold) {
                subjStat.recentTotal++;
                if (log.isCorrect) subjStat.recentCorrect++;
            }

            // Topic stats
            if (topicId && topicName) {
                const topicKey = `${subjectId}:${topicId}`;
                if (!topicStats.has(topicKey)) {
                    topicStats.set(topicKey, {
                        topicId,
                        name: topicName,
                        subjectId,
                        subjectName,
                        correct: 0,
                        total: 0,
                    });
                }
                const topicStat = topicStats.get(topicKey)!;
                topicStat.total++;
                if (log.isCorrect) topicStat.correct++;
            }

            // Difficulty stats
            if (!difficultyStats.has(difficulty)) {
                difficultyStats.set(difficulty, { correct: 0, total: 0 });
            }
            const diffStat = difficultyStats.get(difficulty)!;
            diffStat.total++;
            if (log.isCorrect) diffStat.correct++;
        }

        // Build weak subjects array (sorted by accuracy ascending = worst first)
        const weakSubjects: SubjectWeakness[] = Array.from(subjectStats.values())
            .filter(s => s.total >= 3) // Minimum 3 questions for significance
            .map(s => {
                const accuracy = s.total > 0 ? (s.correct / s.total) * 100 : 0;
                const recentAccuracy = s.recentTotal > 0 ? (s.recentCorrect / s.recentTotal) * 100 : accuracy;
                const overallAccuracy = accuracy;

                let trend: 'improving' | 'declining' | 'stable' = 'stable';
                if (s.recentTotal >= 3) {
                    if (recentAccuracy > overallAccuracy + 5) trend = 'improving';
                    else if (recentAccuracy < overallAccuracy - 5) trend = 'declining';
                }

                return {
                    subjectId: s.subjectId,
                    name: s.name,
                    accuracy: Math.round(accuracy * 10) / 10,
                    totalQuestions: s.total,
                    correctCount: s.correct,
                    errorCount: s.total - s.correct,
                    trend,
                };
            })
            .sort((a, b) => a.accuracy - b.accuracy);

        // Build weak topics array
        const weakTopics: TopicWeakness[] = Array.from(topicStats.values())
            .filter(t => t.total >= 2) // Minimum 2 questions
            .map(t => ({
                topicId: t.topicId,
                name: t.name,
                subjectId: t.subjectId,
                subjectName: t.subjectName,
                accuracy: Math.round((t.correct / t.total) * 100 * 10) / 10,
                totalQuestions: t.total,
                errorCount: t.total - t.correct,
            }))
            .sort((a, b) => a.accuracy - b.accuracy);

        // Build difficulty breakdown
        const weakDifficulty: DifficultyWeakness[] = Array.from(difficultyStats.entries())
            .map(([difficulty, stat]) => ({
                difficulty,
                accuracy: Math.round((stat.correct / stat.total) * 100 * 10) / 10,
                totalQuestions: stat.total,
                errorCount: stat.total - stat.correct,
            }))
            .sort((a, b) => a.accuracy - b.accuracy);

        // Calculate overall metrics
        const totalQuestions = mistakeLogs.length;
        const totalCorrect = mistakeLogs.filter(l => l.isCorrect).length;
        const totalErrors = totalQuestions - totalCorrect;
        const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

        // Get historical accuracy for trend
        const last30Days = await prisma.userWeaknessSnapshot.findMany({
            where: {
                userId,
                snapshotDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            orderBy: { snapshotDate: 'asc' },
            select: {
                snapshotDate: true,
                overallAccuracy: true,
            },
        });

        const accuracyTrend = last30Days.map(s => ({
            date: s.snapshotDate.toISOString().split('T')[0],
            accuracy: s.overallAccuracy,
        }));

        // Calculate improvement score
        let improvementScore = 0;
        if (accuracyTrend.length >= 2) {
            const firstAccuracy = accuracyTrend[0].accuracy;
            const lastAccuracy = overallAccuracy;
            improvementScore = lastAccuracy - firstAccuracy;
        }

        // Store the snapshot
        await prisma.userWeaknessSnapshot.create({
            data: {
                userId,
                weakSubjects: weakSubjects as any,
                weakTopics: weakTopics as any,
                weakDifficulty: weakDifficulty as any,
                overallAccuracy: Math.round(overallAccuracy * 10) / 10,
                totalQuestions,
                totalCorrect,
                totalErrors,
                accuracyTrend: accuracyTrend as any,
                improvementScore: Math.round(improvementScore * 10) / 10,
            },
        });

        console.log(`[WeaknessProfiler] Snapshot created for user ${userId}: ${overallAccuracy.toFixed(1)}% accuracy`);

    } catch (error) {
        console.error('[WeaknessProfiler] Failed to refresh snapshot:', error);
    }
}

/**
 * Get the latest weakness profile for a user
 */
export async function getWeaknessProfile(userId: string): Promise<{
    hasData: boolean;
    snapshot: any | null;
    topWeakSubjects: SubjectWeakness[];
    topImprovedSubjects: SubjectWeakness[];
    suggestedAction: string | null;
}> {
    const snapshot = await prisma.userWeaknessSnapshot.findFirst({
        where: { userId },
        orderBy: { snapshotDate: 'desc' },
    });

    if (!snapshot) {
        return {
            hasData: false,
            snapshot: null,
            topWeakSubjects: [],
            topImprovedSubjects: [],
            suggestedAction: null,
        };
    }

    const weakSubjects = (snapshot.weakSubjects as unknown as SubjectWeakness[]) || [];

    // Top 3 weak subjects (worst accuracy)
    const topWeakSubjects = weakSubjects.slice(0, 3);

    // Top 3 improved subjects (trend = improving)
    const topImprovedSubjects = weakSubjects
        .filter(s => s.trend === 'improving')
        .slice(0, 3);

    // Generate suggested action
    let suggestedAction: string | null = null;
    if (topWeakSubjects.length > 0) {
        const weakest = topWeakSubjects[0];
        if (weakest.accuracy < 40) {
            suggestedAction = `Focus on ${weakest.name} - your accuracy is critical (${weakest.accuracy}%)`;
        } else if (weakest.accuracy < 60) {
            suggestedAction = `Practice ${weakest.name} to improve your ${weakest.accuracy}% accuracy`;
        } else {
            suggestedAction = `Keep practicing ${weakest.name} to maintain your progress`;
        }
    }

    return {
        hasData: true,
        snapshot,
        topWeakSubjects,
        topImprovedSubjects,
        suggestedAction,
    };
}

/**
 * Asynchronously refresh snapshot (fire-and-forget)
 */
export function refreshWeaknessSnapshotAsync(userId: string): void {
    if (!isFeatureEnabled('mistakeIntelligence')) {
        return;
    }

    // Run in background with setImmediate to not block the event loop
    setImmediate(() => {
        refreshWeaknessSnapshot(userId).catch(err =>
            console.error('[WeaknessProfiler] Async refresh failed:', err)
        );
    });
}
