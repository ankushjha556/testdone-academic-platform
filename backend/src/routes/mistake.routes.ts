/**
 * Mistake Intelligence Routes
 * 
 * API endpoints for the Mistake Intelligence System.
 * Provides weakness profiles, subject analysis, and improvement trends.
 */

import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { isFeatureEnabled } from '../lib/featureFlags';
import { getWeaknessProfile, refreshWeaknessSnapshot } from '../lib/weaknessProfiler';

const router = Router();

/**
 * Middleware to check if Mistake Intelligence feature is enabled
 */
const checkFeatureEnabled = (req: any, res: any, next: any) => {
    if (!isFeatureEnabled('mistakeIntelligence')) {
        return res.status(503).json({
            success: false,
            error: { message: 'Mistake Intelligence feature is not enabled' },
        });
    }
    next();
};

// GET /api/v1/mistakes/profile - Get user's weakness profile
router.get('/profile', authenticate, checkFeatureEnabled, async (req: AuthRequest, res, next) => {
    try {
        const profile = await getWeaknessProfile(req.user!.id);

        res.json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/mistakes/subjects - Get subject-wise accuracy breakdown
router.get('/subjects', authenticate, checkFeatureEnabled, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;

        // Get all logs and manually aggregate (more reliable than groupBy for booleans)
        const logs = await prisma.userMistakeLog.findMany({
            where: { userId },
            select: {
                subjectId: true,
                isCorrect: true,
            },
        });

        // Aggregate by subject
        const subjectStats = new Map<string, { total: number; correct: number }>();
        for (const log of logs) {
            if (!subjectStats.has(log.subjectId)) {
                subjectStats.set(log.subjectId, { total: 0, correct: 0 });
            }
            const stat = subjectStats.get(log.subjectId)!;
            stat.total++;
            if (log.isCorrect) stat.correct++;
        }

        // Get subject names
        const subjectIds = Array.from(subjectStats.keys());
        const subjects = await prisma.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true },
        });

        const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

        // Calculate accuracy for each subject
        const breakdown = Array.from(subjectStats.entries()).map(([subjectId, stat]) => {
            const accuracy = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0;

            return {
                subjectId,
                name: subjectMap.get(subjectId) || 'Unknown',
                totalQuestions: stat.total,
                correctCount: stat.correct,
                errorCount: stat.total - stat.correct,
                accuracy: Math.round(accuracy * 10) / 10,
            };
        }).sort((a, b) => a.accuracy - b.accuracy);

        res.json({
            success: true,
            data: {
                subjects: breakdown,
                weakest: breakdown.slice(0, 3),
                strongest: breakdown.slice(-3).reverse(),
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/mistakes/trends - Get improvement trends over time
router.get('/trends', authenticate, checkFeatureEnabled, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const { days = '30' } = req.query;
        const daysNum = Math.min(parseInt(days as string, 10), 90);

        const dateThreshold = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

        // Get daily aggregated accuracy
        const logs = await prisma.userMistakeLog.findMany({
            where: {
                userId,
                createdAt: { gte: dateThreshold },
            },
            select: {
                createdAt: true,
                isCorrect: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Group by date
        const dailyStats = new Map<string, { correct: number; total: number }>();
        for (const log of logs) {
            const date = log.createdAt.toISOString().split('T')[0];
            if (!dailyStats.has(date)) {
                dailyStats.set(date, { correct: 0, total: 0 });
            }
            const stat = dailyStats.get(date)!;
            stat.total++;
            if (log.isCorrect) stat.correct++;
        }

        const trend = Array.from(dailyStats.entries()).map(([date, stat]) => ({
            date,
            accuracy: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100 * 10) / 10 : 0,
            questionsAttempted: stat.total,
            correctCount: stat.correct,
        }));

        // Calculate overall improvement
        let improvement = 0;
        if (trend.length >= 7) {
            const firstWeekAvg = trend.slice(0, 7).reduce((sum, d) => sum + d.accuracy, 0) / 7;
            const lastWeekAvg = trend.slice(-7).reduce((sum, d) => sum + d.accuracy, 0) / 7;
            improvement = lastWeekAvg - firstWeekAvg;
        }

        res.json({
            success: true,
            data: {
                trend,
                improvement: Math.round(improvement * 10) / 10,
                message: improvement > 5
                    ? `Great progress! Your accuracy improved by ${improvement.toFixed(1)}%`
                    : improvement > 0
                        ? `You are improving! Keep practicing.`
                        : improvement < -5
                            ? `Your accuracy declined. Consider focusing on weak areas.`
                            : 'Maintain consistency to see improvement.',
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/mistakes/history - Paginated mistake history (Premium only)
router.get('/history', authenticate, checkFeatureEnabled, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const { page = '1', limit = '20', subject, isCorrect } = req.query;

        // Premium check
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const allowedRoles = ['PREMIUM_USER', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'];
        if (!allowedRoles.includes(user?.role || '')) {
            const hasSubscription = await prisma.subscription.findFirst({
                where: {
                    userId,
                    status: 'ACTIVE',
                    endDate: { gt: new Date() },
                },
            });

            if (!hasSubscription) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Premium subscription required for mistake history' },
                });
            }
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 50);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { userId };
        if (subject) {
            where.subjectId = subject;
        }
        if (isCorrect === 'true') {
            where.isCorrect = true;
        } else if (isCorrect === 'false') {
            where.isCorrect = false;
        }

        const [logs, total] = await Promise.all([
            prisma.userMistakeLog.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    question: {
                        select: {
                            questionText: true,
                            subject: { select: { name: true } },
                            topic: { select: { name: true } },
                        },
                    },
                },
            }),
            prisma.userMistakeLog.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                history: logs.map(log => ({
                    id: log.id,
                    questionId: log.questionId,
                    questionText: log.question.questionText.substring(0, 100) + '...',
                    subject: log.question.subject.name,
                    topic: log.question.topic?.name || null,
                    difficulty: log.difficulty,
                    isCorrect: log.isCorrect,
                    selectedOption: log.selectedOption,
                    correctOption: log.correctOption,
                    mistakeType: log.mistakeType,
                    timeSpent: log.timeSpentSeconds,
                    date: log.createdAt,
                })),
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalItems: total,
                    perPage: limitNum,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/mistakes/refresh - Manually refresh weakness snapshot
router.post('/refresh', authenticate, checkFeatureEnabled, async (req: AuthRequest, res, next) => {
    try {
        await refreshWeaknessSnapshot(req.user!.id);

        res.json({
            success: true,
            message: 'Weakness profile refreshed successfully',
        });
    } catch (error) {
        next(error);
    }
});

export default router;
