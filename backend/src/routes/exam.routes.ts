import { Router } from 'express';
import prisma from '../lib/prisma';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/exams - List all exams
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
    try {
        const {
            category,
            featured,
            search,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 100);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            status: 'PUBLISHED',
        };

        if (category) {
            where.category = { slug: category };
        }

        if (featured === 'true') {
            where.isFeatured = true;
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { fullName: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const [exams, total] = await Promise.all([
            prisma.exam.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    fullName: true,
                    conductingBody: true,
                    iconUrl: true,
                    color: true,
                    isFeatured: true,
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            icon: true,
                            color: true,
                        },
                    },
                    _count: {
                        select: {
                            mockTests: true,
                            questionExams: true,
                        },
                    },
                },
            }),
            prisma.exam.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                exams: exams.map(exam => ({
                    ...exam,
                    testsCount: exam._count.mockTests,
                    questionsCount: exam._count.questionExams,
                    _count: undefined,
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

// GET /api/v1/exams/categories - List all exam categories
router.get('/categories', async (req, res, next) => {
    try {
        const categories = await prisma.examCategory.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                color: true,
                _count: {
                    select: { exams: true },
                },
            },
        });

        res.json({
            success: true,
            data: {
                categories: categories.map(cat => ({
                    ...cat,
                    examsCount: cat._count.exams,
                    _count: undefined,
                }))
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/exams/with-questions - List exams that have questions (Phase 1 Fix)
router.get('/with-questions', optionalAuth, async (req: AuthRequest, res, next) => {
    try {
        const exams = await prisma.exam.findMany({
            where: {
                status: 'PUBLISHED',
                questionExams: {
                    some: {
                        question: { status: 'PUBLISHED' }
                    }
                }
            },
            select: {
                id: true,
                name: true,
                slug: true,
            },
            orderBy: { name: 'asc' }
        });

        res.json({
            success: true,
            data: {
                exams
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/exams/:slug - Get exam details
router.get('/:slug', optionalAuth, async (req: AuthRequest, res, next) => {
    try {
        const { slug } = req.params;

        const exam = await prisma.exam.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                fullName: true,
                description: true,
                eligibility: true,
                syllabus: true,
                examPattern: true,
                conductingBody: true,
                frequency: true,
                vacancies: true,
                salaryRange: true,
                iconUrl: true,
                color: true,
                isFeatured: true,
                metaTitle: true,
                metaDescription: true,
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                _count: {
                    select: {
                        mockTests: true,
                        questionExams: true,
                    },
                },
            },
        });

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: { message: 'Exam not found' },
            });
        }

        // Get related exams
        const relatedExams = await prisma.exam.findMany({
            where: {
                categoryId: exam.category.id,
                slug: { not: slug },
                status: 'PUBLISHED',
            },
            take: 5,
            select: {
                id: true,
                name: true,
                slug: true,
                iconUrl: true,
            },
        });

        res.json({
            success: true,
            data: {
                ...exam,
                testsCount: exam._count.mockTests,
                questionsCount: exam._count.questionExams,
                relatedExams,
                _count: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/exams/:slug/tests - Get tests for an exam
router.get('/:slug/tests', optionalAuth, async (req: AuthRequest, res, next) => {
    try {
        const { slug } = req.params;
        const { type, access, page = '1', limit = '20' } = req.query;

        const exam = await prisma.exam.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!exam) {
            return res.status(404).json({
                success: false,
                error: { message: 'Exam not found' },
            });
        }

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 50);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            examId: exam.id,
            status: 'PUBLISHED',
        };

        if (type) {
            where.testType = type;
        }

        if (access) {
            where.accessType = access;
        }

        const [tests, total] = await Promise.all([
            prisma.mockTest.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    testType: true,
                    totalQuestions: true,
                    totalMarks: true,
                    durationMinutes: true,
                    accessType: true,
                    isAllIndia: true,
                    _count: {
                        select: { attempts: true },
                    },
                },
            }),
            prisma.mockTest.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                tests: tests.map(test => ({
                    ...test,
                    attemptsCount: test._count.attempts,
                    _count: undefined,
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

export default router;
