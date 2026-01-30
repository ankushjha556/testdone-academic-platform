/**
 * Smart Practice Routes
 * 
 * Premium-only feature that provides personalized practice based on user weaknesses.
 * Uses the Mistake Intelligence System to select questions.
 */

import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { isFeatureEnabled, isSmartPracticeAvailable } from '../lib/featureFlags';
import { getWeaknessProfile } from '../lib/weaknessProfiler';
import { logSmartPracticeAnswer } from '../lib/mistakeLogger';

const router = Router();

/**
 * Check if Smart Practice is enabled
 */
const checkSmartPracticeEnabled = (req: any, res: any, next: any) => {
    if (!isSmartPracticeAvailable()) {
        return res.status(503).json({
            success: false,
            error: { message: 'Smart Practice feature is not enabled' },
        });
    }
    next();
};

/**
 * Check if user has premium access
 */
const checkPremiumAccess = async (req: AuthRequest, res: any, next: any) => {
    try {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        const allowedRoles = ['PREMIUM_USER', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'];
        if (allowedRoles.includes(user?.role || '')) {
            return next();
        }

        // Check subscription
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
                error: {
                    message: 'Premium subscription required for Smart Practice',
                    code: 'PREMIUM_REQUIRED',
                },
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

// GET /api/v1/smart-practice/modes - Available practice modes
router.get('/modes', authenticate, checkSmartPracticeEnabled, checkPremiumAccess, async (req: AuthRequest, res, next) => {
    try {
        const profile = await getWeaknessProfile(req.user!.id);

        const modes = [
            {
                id: 'fix-weak',
                name: 'Fix Weak Areas',
                description: 'Focus on subjects and topics where you struggle most',
                icon: 'target',
                available: profile.topWeakSubjects.length > 0,
                suggestedSubject: profile.topWeakSubjects[0]?.name || null,
            },
            {
                id: 'retry-mistakes',
                name: 'Retry Past Mistakes',
                description: 'Practice questions you got wrong before',
                icon: 'refresh',
                available: true,
            },
            {
                id: 'accuracy-booster',
                name: 'Accuracy Booster',
                description: 'Practice similar questions to improve accuracy',
                icon: 'trending-up',
                available: true,
            },
            {
                id: 'speed-booster',
                name: 'Speed Booster',
                description: 'Practice to improve your speed on familiar topics',
                icon: 'zap',
                available: profile.topImprovedSubjects.length > 0,
            },
        ];

        res.json({
            success: true,
            data: {
                modes,
                suggestedAction: profile.suggestedAction,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/smart-practice/questions - Get personalized questions
router.get('/questions', authenticate, checkSmartPracticeEnabled, checkPremiumAccess, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const { mode = 'fix-weak', limit = '10', subject } = req.query;
        const limitNum = Math.min(parseInt(limit as string, 10), 25);

        let questions: any[] = [];

        switch (mode) {
            case 'fix-weak': {
                // Get questions from weak subjects
                const profile = await getWeaknessProfile(userId);
                const weakSubjectIds = profile.topWeakSubjects.map(s => s.subjectId);

                if (weakSubjectIds.length === 0) {
                    // Fallback to random questions if no weakness data
                    questions = await prisma.question.findMany({
                        where: {
                            status: 'PUBLISHED',
                            ...(subject ? { subjectId: subject as string } : {}),
                        },
                        take: limitNum,
                        orderBy: { createdAt: 'desc' },
                        select: getQuestionSelect(),
                    });
                } else {
                    questions = await prisma.question.findMany({
                        where: {
                            status: 'PUBLISHED',
                            subjectId: subject as string || { in: weakSubjectIds },
                        },
                        take: limitNum,
                        orderBy: { difficulty: 'asc' }, // Start with easier questions
                        select: getQuestionSelect(),
                    });
                }
                break;
            }

            case 'retry-mistakes': {
                // Get questions user got wrong before
                const wrongAnswers = await prisma.userMistakeLog.findMany({
                    where: {
                        userId,
                        isCorrect: false,
                        ...(subject ? { subjectId: subject as string } : {}),
                    },
                    take: limitNum * 2, // Get more to ensure unique questions
                    orderBy: { createdAt: 'desc' },
                    select: { questionId: true },
                    distinct: ['questionId'],
                });

                const questionIds = wrongAnswers.map(a => a.questionId).slice(0, limitNum);

                if (questionIds.length > 0) {
                    questions = await prisma.question.findMany({
                        where: {
                            id: { in: questionIds },
                            status: 'PUBLISHED',
                        },
                        select: getQuestionSelect(),
                    });
                }
                break;
            }

            case 'accuracy-booster': {
                // Get questions from subjects with 40-70% accuracy
                const logs = await prisma.userMistakeLog.findMany({
                    where: { userId },
                    select: { subjectId: true, isCorrect: true },
                });

                // Calculate per-subject accuracy
                const subjectStats = new Map<string, { correct: number; total: number }>();
                for (const log of logs) {
                    if (!subjectStats.has(log.subjectId)) {
                        subjectStats.set(log.subjectId, { correct: 0, total: 0 });
                    }
                    const stat = subjectStats.get(log.subjectId)!;
                    stat.total++;
                    if (log.isCorrect) stat.correct++;
                }

                // Find subjects with 40-70% accuracy
                const mediumSubjects = Array.from(subjectStats.entries())
                    .filter(([, s]) => {
                        const acc = s.total > 0 ? (s.correct / s.total) * 100 : 0;
                        return acc >= 40 && acc <= 70;
                    })
                    .map(([id]) => id);

                if (mediumSubjects.length > 0) {
                    questions = await prisma.question.findMany({
                        where: {
                            status: 'PUBLISHED',
                            subjectId: subject as string || { in: mediumSubjects },
                            difficulty: { in: ['EASY', 'MEDIUM'] },
                        },
                        take: limitNum,
                        select: getQuestionSelect(),
                    });
                }
                break;
            }

            case 'speed-booster': {
                // Get questions from strong subjects
                const profile = await getWeaknessProfile(userId);
                const strongSubjectIds = profile.topImprovedSubjects.map(s => s.subjectId);

                if (strongSubjectIds.length > 0) {
                    questions = await prisma.question.findMany({
                        where: {
                            status: 'PUBLISHED',
                            subjectId: subject as string || { in: strongSubjectIds },
                        },
                        take: limitNum,
                        select: getQuestionSelect(),
                    });
                }
                break;
            }
        }

        // Fallback if no questions found
        if (questions.length === 0) {
            questions = await prisma.question.findMany({
                where: {
                    status: 'PUBLISHED',
                    ...(subject ? { subjectId: subject as string } : {}),
                },
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: getQuestionSelect(),
            });
        }

        res.json({
            success: true,
            data: {
                questions: questions.map(q => ({
                    id: q.id,
                    questionText: q.questionText,
                    options: q.options,
                    difficulty: q.difficulty,
                    subject: q.subject.name,
                    topic: q.topic?.name || null,
                    // Don't include correct answer - client will check via submit
                })),
                count: questions.length,
                mode,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/smart-practice/submit - Submit practice answer
router.post('/submit', authenticate, checkSmartPracticeEnabled, checkPremiumAccess, async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const { questionId, selectedOption, timeSpentSeconds } = req.body;

        if (!questionId || !selectedOption) {
            return res.status(400).json({
                success: false,
                error: { message: 'questionId and selectedOption are required' },
            });
        }

        // Get question
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            select: {
                id: true,
                correctAnswer: true,
                solution: true,
                conceptNote: true,
                difficulty: true,
                subjectId: true,
                topicId: true,
                questionExams: {
                    select: { examId: true },
                    take: 1,
                },
            },
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                error: { message: 'Question not found' },
            });
        }

        const isCorrect = selectedOption === question.correctAnswer;

        // Log to mistake intelligence
        await logSmartPracticeAnswer(
            userId,
            {
                id: question.id,
                correctAnswer: question.correctAnswer,
                difficulty: question.difficulty,
                subjectId: question.subjectId,
                topicId: question.topicId,
                examId: question.questionExams[0]?.examId,
            },
            selectedOption,
            isCorrect,
            timeSpentSeconds
        );

        res.json({
            success: true,
            data: {
                isCorrect,
                correctAnswer: question.correctAnswer,
                solution: question.solution,
                conceptNote: question.conceptNote,
                message: isCorrect
                    ? 'Great job! You got it right.'
                    : 'Not quite. Review the solution to understand.',
            },
        });
    } catch (error) {
        next(error);
    }
});

// Helper function for question selection
function getQuestionSelect() {
    return {
        id: true,
        questionText: true,
        options: true,
        correctAnswer: true,
        difficulty: true,
        subject: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
    };
}

export default router;
