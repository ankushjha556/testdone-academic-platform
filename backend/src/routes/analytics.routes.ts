import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/analytics - User analytics dashboard
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { exam, period = 'all' } = req.query;

        let dateFilter = {};
        if (period === 'week') {
            dateFilter = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        } else if (period === 'month') {
            dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        }

        const whereAttempt: any = {
            userId: req.user!.id,
            status: 'COMPLETED',
        };

        if (Object.keys(dateFilter).length > 0) {
            whereAttempt.completedAt = dateFilter;
        }

        if (exam) {
            whereAttempt.test = { exam: { slug: exam } };
        }

        // Get attempts summary
        const attempts = await prisma.testAttempt.findMany({
            where: whereAttempt,
            select: {
                id: true,
                totalScore: true,
                correctCount: true,
                incorrectCount: true,
                unattemptedCount: true,
                completedAt: true,
                test: {
                    select: {
                        totalMarks: true,
                        totalQuestions: true,
                    },
                },
            },
        });

        const testsAttempted = attempts.length;
        const totalQuestions = attempts.reduce((sum, a) => sum + a.test.totalQuestions, 0);
        const totalCorrect = attempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
        const totalIncorrect = attempts.reduce((sum, a) => sum + (a.incorrectCount || 0), 0);

        const avgScore = testsAttempted > 0
            ? attempts.reduce((sum, a) => sum + (Number(a.totalScore) / Number(a.test.totalMarks)) * 100, 0) / testsAttempted
            : 0;

        const accuracy = (totalCorrect + totalIncorrect) > 0
            ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100
            : 0;

        // Score trend (last 10 tests)
        const scoreTrend = attempts.slice(0, 10).reverse().map(a => ({
            date: a.completedAt,
            score: (Number(a.totalScore) / Number(a.test.totalMarks)) * 100,
        }));

        // Subject-wise analysis from attempt answers
        const subjectAnalysis = await prisma.attemptAnswer.groupBy({
            by: ['questionId'],
            where: {
                attempt: whereAttempt,
            },
            _count: { isCorrect: true },
        });

        res.json({
            success: true,
            data: {
                summary: {
                    testsAttempted,
                    questionsAttempted: totalQuestions,
                    averageScore: Math.round(avgScore * 10) / 10,
                    accuracy: Math.round(accuracy * 10) / 10,
                },
                scoreTrend,
                subjectBreakdown: [], // Would need more complex query
                weakTopics: [],
                strongTopics: [],
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/analytics/leaderboard
router.get('/leaderboard', async (req, res, next) => {
    try {
        const { exam, period = 'weekly', page = '1', limit = '50' } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 100);
        const skip = (pageNum - 1) * limitNum;

        let dateFilter: any = {};
        if (period === 'daily') {
            dateFilter = { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
        } else if (period === 'weekly') {
            dateFilter = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        } else if (period === 'monthly') {
            dateFilter = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        }

        const where: any = {
            status: 'COMPLETED',
        };

        if (Object.keys(dateFilter).length > 0) {
            where.completedAt = dateFilter;
        }

        if (exam) {
            where.test = { exam: { slug: exam } };
        }

        // Get top performers
        const leaderboard = await prisma.user.findMany({
            where: {
                attempts: {
                    some: where,
                },
            },
            take: limitNum,
            skip,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                state: true,
                attempts: {
                    where,
                    select: {
                        totalScore: true,
                        correctCount: true,
                        incorrectCount: true,
                        test: {
                            select: { totalMarks: true },
                        },
                    },
                },
            },
        });

        // Calculate aggregate scores
        const rankedUsers = leaderboard.map(user => {
            const totalTests = user.attempts.length;
            const avgScore = totalTests > 0
                ? user.attempts.reduce((sum, a) => sum + (Number(a.totalScore) / Number(a.test.totalMarks)) * 100, 0) / totalTests
                : 0;
            const totalCorrect = user.attempts.reduce((sum, a) => sum + (a.correctCount || 0), 0);
            const totalIncorrect = user.attempts.reduce((sum, a) => sum + (a.incorrectCount || 0), 0);
            const accuracy = (totalCorrect + totalIncorrect) > 0
                ? (totalCorrect / (totalCorrect + totalIncorrect)) * 100
                : 0;

            return {
                id: user.id,
                name: `${user.firstName} ${user.lastName || ''}`.trim(),
                avatarUrl: user.avatarUrl,
                state: user.state,
                testsAttempted: totalTests,
                avgScore: Math.round(avgScore * 10) / 10,
                accuracy: Math.round(accuracy * 10) / 10,
            };
        }).sort((a, b) => b.avgScore - a.avgScore);

        // Add ranks
        const rankedWithPosition = rankedUsers.map((u, i) => ({
            rank: skip + i + 1,
            ...u,
        }));

        res.json({
            success: true,
            data: {
                leaderboard: rankedWithPosition,
                totalParticipants: rankedUsers.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
