import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/users/profile - Get user profile
router.get('/profile', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                mobile: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                education: true,
                state: true,
                city: true,
                role: true,
                targetExam: {
                    select: { id: true, name: true, slug: true },
                },
                createdAt: true,
                _count: {
                    select: {
                        attempts: true,
                        bookmarks: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: {
                ...user,
                testsAttempted: user?._count.attempts,
                bookmarksCount: user?._count.bookmarks,
                _count: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/v1/users/profile - Update profile
router.patch('/profile', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { firstName, lastName, education, state, city, targetExamId } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                firstName,
                lastName,
                education,
                state,
                city,
                targetExamId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                education: true,
                state: true,
                city: true,
                targetExam: {
                    select: { id: true, name: true },
                },
            },
        });

        res.json({
            success: true,
            message: 'Profile updated',
            data: user,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/users/attempts - Get user's test attempts
router.get('/attempts', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 50);
        const skip = (pageNum - 1) * limitNum;

        const [attempts, total] = await Promise.all([
            prisma.testAttempt.findMany({
                where: {
                    userId: req.user!.id,
                    status: 'COMPLETED',
                },
                skip,
                take: limitNum,
                orderBy: { completedAt: 'desc' },
                select: {
                    id: true,
                    totalScore: true,
                    correctCount: true,
                    incorrectCount: true,
                    unattemptedCount: true,
                    allIndiaRank: true,
                    percentile: true,
                    completedAt: true,
                    test: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            totalMarks: true,
                            exam: {
                                select: { name: true, slug: true },
                            },
                        },
                    },
                },
            }),
            prisma.testAttempt.count({
                where: { userId: req.user!.id, status: 'COMPLETED' },
            }),
        ]);

        res.json({
            success: true,
            data: {
                attempts,
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

export default router;
