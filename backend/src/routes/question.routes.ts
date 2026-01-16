import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/questions - Question bank (PREMIUM ONLY)
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
    try {
        // Premium Access Control - Question Bank is PREMIUM ONLY
        const allowedRoles = ['PREMIUM_USER', 'ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER', 'MODERATOR'];
        if (req.user && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Premium subscription required to access the Question Bank',
                    code: 'PREMIUM_REQUIRED'
                }
            });
        }

        const {
            subject,
            topic,
            difficulty,
            exam,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 50);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            status: 'PUBLISHED',
        };

        if (subject) {
            where.subject = { slug: subject };
        }

        if (topic) {
            where.topic = { slug: topic };
        }

        if (difficulty) {
            where.difficulty = difficulty;
        }

        if (exam) {
            where.questionExams = {
                some: {
                    exam: { slug: exam },
                },
            };
        }

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    questionText: true,
                    questionType: true,
                    options: true,
                    difficulty: true,
                    subject: {
                        select: { id: true, name: true, slug: true },
                    },
                    topic: {
                        select: { id: true, name: true, slug: true },
                    },
                    questionExams: {
                        select: {
                            exam: { select: { id: true, name: true, slug: true } },
                        },
                    },
                },
            }),
            prisma.question.count({ where }),
        ]);

        // Get user's attempts for these questions
        const questionIds = questions.map(q => q.id);
        const userAttempts = await prisma.attemptAnswer.findMany({
            where: {
                questionId: { in: questionIds },
                attempt: { userId: req.user!.id },
            },
            select: {
                questionId: true,
                isCorrect: true,
            },
        });

        const attemptMap = userAttempts.reduce((acc, a) => {
            acc[a.questionId] = a;
            return acc;
        }, {} as Record<string, any>);

        res.json({
            success: true,
            data: {
                questions: questions.map(q => ({
                    ...q,
                    userAttempt: attemptMap[q.id] || null,
                    exams: q.questionExams?.map(qe => qe.exam) || [],
                    questionExams: undefined,
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

// GET /api/v1/questions/:id - Get question details
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const question = await prisma.question.findUnique({
            where: { id },
            select: {
                id: true,
                questionText: true,
                questionType: true,
                options: true,
                difficulty: true,
                year: true,
                source: true,
                tags: true,
                subject: {
                    select: { id: true, name: true, slug: true },
                },
                topic: {
                    select: { id: true, name: true, slug: true },
                },
                questionExams: {
                    select: {
                        exam: { select: { id: true, name: true, slug: true } },
                    },
                },
            },
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                error: { message: 'Question not found' },
            });
        }

        res.json({
            success: true,
            data: {
                ...question,
                exams: question.questionExams.map(qe => qe.exam),
                questionExams: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/questions/:id/solution - Get solution
router.get('/:id/solution', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const question = await prisma.question.findUnique({
            where: { id },
            select: {
                id: true,
                correctAnswer: true,
                solution: true,
                conceptNote: true,
            },
        });

        if (!question) {
            return res.status(404).json({
                success: false,
                error: { message: 'Question not found' },
            });
        }

        res.json({
            success: true,
            data: question,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/questions/:id/bookmark - Bookmark question
router.post('/:id/bookmark', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const existing = await prisma.bookmark.findUnique({
            where: {
                userId_questionId: {
                    userId: req.user!.id,
                    questionId: id,
                },
            },
        });

        if (existing) {
            // Remove bookmark
            await prisma.bookmark.delete({
                where: { id: existing.id },
            });
            return res.json({
                success: true,
                message: 'Bookmark removed',
                bookmarked: false,
            });
        }

        // Add bookmark
        await prisma.bookmark.create({
            data: {
                userId: req.user!.id,
                questionId: id,
            },
        });

        res.json({
            success: true,
            message: 'Question bookmarked',
            bookmarked: true,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/questions/bookmarks - Get bookmarked questions
router.get('/user/bookmarks', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: req.user!.id },
            orderBy: { createdAt: 'desc' },
            include: {
                question: {
                    select: {
                        id: true,
                        questionText: true,
                        difficulty: true,
                        subject: { select: { name: true } },
                        topic: { select: { name: true } },
                    },
                },
            },
        });

        res.json({
            success: true,
            data: bookmarks.map(b => ({
                id: b.id,
                createdAt: b.createdAt,
                question: b.question,
            })),
        });
    } catch (error) {
        next(error);
    }
});

export default router;
