import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createQuestionSchema, createTestSchema, updateTestSchema } from '../validators/admin.schema';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'));

// GET /api/v1/admin/dashboard
router.get('/dashboard', async (req: AuthRequest, res, next) => {
    try {
        const [
            totalUsers,
            activeSubscriptions,
            todayRegistrations,
            totalTests,
            totalQuestions,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            prisma.mockTest.count({ where: { status: 'PUBLISHED' } }),
            prisma.question.count({ where: { status: 'PUBLISHED' } }),
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                activeSubscriptions,
                todayRegistrations,
                totalTests,
                totalQuestions,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/admin/stats - Alias for dashboard stats
router.get('/stats', async (req: AuthRequest, res, next) => {
    try {
        const [
            totalUsers,
            activeSubscriptions,
            todayRegistrations,
            totalTests,
            totalQuestions,
            totalExams,
            totalSubjects,
            publishedExams,
            publishedQuestions,
            recentUsers
        ] = await Promise.all([
            prisma.user.count(),
            prisma.subscription.count({ where: { status: 'ACTIVE' } }),
            prisma.user.count({
                where: {
                    createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                },
            }),
            prisma.mockTest.count(),
            prisma.question.count(),
            prisma.exam.count(),
            prisma.subject.count(),
            prisma.exam.count({ where: { status: 'PUBLISHED' } }),
            prisma.question.count({ where: { status: 'PUBLISHED' } }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { firstName: true, lastName: true, createdAt: true }
            })
        ]);

        const recentActivity = recentUsers.map(u => ({
            title: `New user registered: ${u.firstName} ${u.lastName || ''}`,
            time: new Date(u.createdAt).toLocaleDateString()
        }));

        res.json({
            success: true,
            data: {
                stats: {
                    totalUsers,
                    activeSubscriptions,
                    todayRegistrations,
                    totalTests,
                    totalQuestions,
                    totalExams,
                    totalSubjects,
                    publishedExams,
                    publishedQuestions,
                    recentActivity
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// ============== CONTENT DROPDOWNS ==============

// ============== EXAM CATEGORIES CRUD ==============

// GET /api/v1/admin/categories
router.get('/categories', async (req: AuthRequest, res, next) => {
    try {
        const categories = await prisma.examCategory.findMany({
            orderBy: { order: 'asc' },
            include: { _count: { select: { exams: true } } },
        });
        res.json({ success: true, data: { categories } });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/admin/categories
router.post('/categories', async (req: AuthRequest, res, next) => {
    try {
        const data = req.body;
        const category = await prisma.examCategory.create({ data });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/admin/categories/:id
router.put('/categories/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const category = await prisma.examCategory.update({ where: { id }, data: req.body });
        res.json({ success: true, data: category });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/admin/categories/:id
router.delete('/categories/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        await prisma.examCategory.delete({ where: { id } });
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/admin/subjects
router.get('/subjects', async (req: AuthRequest, res, next) => {
    console.log('GET /admin/subjects hit');
    try {
        const subjects = await prisma.subject.findMany({
            orderBy: { order: 'asc' },
            select: { id: true, name: true, slug: true }
        });
        // Transform to DropdownItem[] format if needed, or sending raw objects
        // Frontend expects { data: { subjects: [...] } }
        res.json({ success: true, data: { subjects } });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/admin/subjects/:id/topics
router.get('/subjects/:id/topics', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const topics = await prisma.topic.findMany({
            where: { subjectId: id },
            orderBy: { order: 'asc' },
            select: { id: true, name: true, slug: true }
        });
        res.json({ success: true, data: { topics } });
    } catch (error) {
        next(error);
    }
});

// ============== EXAM MANAGEMENT ==============

// GET /api/v1/admin/exams
router.get('/exams', async (req: AuthRequest, res, next) => {
    try {
        const { status, category, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) where.status = status;
        if (category) where.category = { slug: category };

        const [exams, total] = await Promise.all([
            prisma.exam.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { name: 'asc' },
                include: {
                    category: { select: { name: true } },
                    _count: { select: { mockTests: true, questionExams: true } },
                },
            }),
            prisma.exam.count({ where }),
        ]);

        res.json({
            success: true,
            data: { exams, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total } },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/admin/exams
router.post('/exams', async (req: AuthRequest, res, next) => {
    try {
        const data = req.body;
        const exam = await prisma.exam.create({ data });
        res.status(201).json({ success: true, data: exam });
    } catch (error: any) {
        console.error('Create Exam Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create exam',
            error: { message: error.message, details: error }
        });
    }
});

// GET /api/v1/admin/exams/:id
router.get('/exams/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const exam = await prisma.exam.findUnique({
            where: { id },
            include: {
                category: { select: { id: true, name: true } }
            }
        });
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }
        res.json({ success: true, data: exam });
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/admin/exams/:id
router.put('/exams/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const exam = await prisma.exam.update({ where: { id }, data: req.body });
        res.json({ success: true, data: exam });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/admin/exams/:id
router.delete('/exams/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        // Deep delete: Delete MockTests and their dependencies first
        const mockTests = await prisma.mockTest.findMany({ where: { examId: id }, select: { id: true } });
        const mockTestIds = mockTests.map(t => t.id);

        if (mockTestIds.length > 0) {
            // Delete TestAttempts (No cascade support in schema)
            await prisma.testAttempt.deleteMany({ where: { testId: { in: mockTestIds } } });
            // TestQuestions have cascade delete from MockTest
            await prisma.mockTest.deleteMany({ where: { id: { in: mockTestIds } } });
        }

        await prisma.exam.delete({ where: { id } });
        res.json({ success: true, message: 'Exam and related tests deleted' });
    } catch (error) {
        next(error);
    }
});

// ============== QUESTION MANAGEMENT ==============

// GET /api/v1/admin/questions
router.get('/questions', async (req: AuthRequest, res, next) => {
    try {
        const { status, subject, difficulty, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) where.status = status;
        if (subject) where.subject = { slug: subject };
        if (difficulty) where.difficulty = difficulty;

        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    subject: { select: { name: true } },
                    topic: { select: { name: true } },
                    createdBy: { select: { firstName: true, lastName: true } },
                },
            }),
            prisma.question.count({ where }),
        ]);

        res.json({
            success: true,
            data: { questions, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total } },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/admin/questions/:id
router.get('/questions/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const question = await prisma.question.findUnique({
            where: { id },
            include: {
                questionExams: { select: { examId: true } },
            }
        });

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        res.json({ success: true, data: { question } });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/admin/questions
router.post('/questions', validate(createQuestionSchema), async (req: AuthRequest, res, next) => {
    try {
        const body = req.body;

        // Sanitize: Remove fields that don't belong in direct create
        // Sanitize: Strictly pick allowed fields
        const {
            questionText,
            questionType,
            options,
            correctAnswer,
            solution,
            conceptNote,
            difficulty,
            year,
            source,
            tags,
            subjectId,
            topicId,
            sectionId,
            explanation,
            // Phantom fields excluded by Schema, but destructure safely
            examIds // examIds (Array) is handled separately for relation creation
        } = body;

        const data: any = {
            questionText,
            questionType,
            options,
            correctAnswer,
            solution: explanation || solution,
            conceptNote,
            difficulty,
            year,
            source,
            tags,
            subjectId: subjectId, // Required
            createdById: req.user!.id,
            topicId: topicId || null,
            sectionId: sectionId || null,
        };

        // Remove undefined/empty values
        if (!data.solution) delete data.solution;
        if (!data.conceptNote) delete data.conceptNote;

        const question = await prisma.question.create({ data });

        // If examIds provided, create the relations separately
        if (examIds && Array.isArray(examIds)) {
            if (examIds.length > 0) {
                await prisma.questionExam.createMany({
                    data: examIds.map((id: string) => ({
                        questionId: question.id,
                        examId: id,
                    })),
                });
            }
        } else if (body.examId) {
            // Fallback for backward compatibility
            await prisma.questionExam.create({
                data: {
                    questionId: question.id,
                    examId: body.examId,
                }
            });
        }

        res.status(201).json({ success: true, data: question });
    } catch (error: any) {
        console.error('Create Question Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create question',
            error: { message: error.message, details: error }
        });
    }
});

// PUT /api/v1/admin/questions/:id
router.put('/questions/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const body = req.body;

        const {
            questionText,
            questionType,
            options,
            correctAnswer,
            solution,
            conceptNote,
            difficulty,
            year,
            source,
            tags,
            subjectId,
            topicId,
            sectionId,
            explanation,
            examIds,
            examId // Keep for backward compat destructuring
        } = body;

        const data: any = {
            questionText,
            questionType,
            options,
            correctAnswer,
            solution: explanation || solution,
            conceptNote,
            difficulty,
            year,
            source,
            tags,
            subjectId,
            topicId: topicId || null,
            sectionId: sectionId || null,
        };

        // Remove undefined values
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        // Transaction to update question and relations
        const question = await prisma.$transaction(async (tx) => {
            const updated = await tx.question.update({
                where: { id },
                data
            });

            if (examIds !== undefined || examId !== undefined) {
                // Update Exam Relation: Clear existing and set new
                await tx.questionExam.deleteMany({ where: { questionId: id } });

                if (examIds && Array.isArray(examIds) && examIds.length > 0) {
                    await tx.questionExam.createMany({
                        data: examIds.map((eid: string) => ({
                            questionId: id,
                            examId: eid,
                        })),
                    });
                } else if (examId) {
                    await tx.questionExam.create({
                        data: {
                            questionId: id,
                            examId: examId
                        }
                    });
                }
            }
            return updated;
        });

        res.json({ success: true, data: question });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/v1/admin/questions/:id/status
router.patch('/questions/:id/status', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const question = await prisma.question.update({
            where: { id },
            data: {
                status,
                approvedById: status === 'APPROVED' ? req.user!.id : null,
            },
        });
        res.json({ success: true, data: question });
    } catch (error) {
        next(error);
    }
});

// ============== TEST MANAGEMENT ==============

// GET /api/v1/admin/tests
router.get('/tests', async (req: AuthRequest, res, next) => {
    try {
        const { status, exam, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (status) where.status = status;
        if (exam) where.exam = { slug: exam };

        const [tests, total] = await Promise.all([
            prisma.mockTest.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                include: {
                    exam: { select: { name: true, slug: true } },
                    createdBy: { select: { firstName: true } },
                    _count: { select: { testQuestions: true, attempts: true } },
                },
            }),
            prisma.mockTest.count({ where }),
        ]);
        res.json({
            success: true,
            data: { tests, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total } },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/admin/tests - Create a new mock test
router.post('/tests', validate(createTestSchema), async (req: AuthRequest, res, next) => {
    try {
        // Zod has ...
        const { questions, title, name, ...testDataBody } = req.body;
        const testName = name || title;

        const test = await prisma.mockTest.create({
            data: {
                name: testName,
                ...testDataBody,
                // Validated numbers
                createdById: req.user!.id,
                testQuestions: {
                    create: questions?.map((q: any, i: number) => ({
                        questionId: q.questionId,
                        sectionIndex: q.sectionIndex || 0,
                        questionOrder: i + 1,
                        marks: Number(q.marks) || 1,
                    })) || [],
                },
            },
        });

        res.status(201).json({ success: true, data: test });
    } catch (error: any) {
        console.error('Create Test Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create test',
            error: { message: error.message, details: error }
        });
    }
});

// PUT /api/v1/admin/tests/:id
router.put('/tests/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const { questions, ...testData } = req.body;

        // Update test data
        const test = await prisma.mockTest.update({
            where: { id },
            data: testData,
        });

        // If questions are provided, update them
        if (questions) {
            await prisma.testQuestion.deleteMany({ where: { testId: id } });
            await prisma.testQuestion.createMany({
                data: questions.map((q: any, i: number) => ({
                    testId: id,
                    questionId: q.questionId,
                    sectionIndex: q.sectionIndex || 0,
                    questionOrder: i + 1,
                    marks: q.marks || 1,
                })),
            });
        }

        res.json({ success: true, data: test });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/v1/admin/tests/:id (partial update)
router.patch('/tests/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const test = await prisma.mockTest.update({ where: { id }, data: req.body });
        res.json({ success: true, data: test });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/admin/tests/:id
router.delete('/tests/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        await prisma.mockTest.delete({ where: { id } });
        res.json({ success: true, message: 'Test deleted' });
    } catch (error) {
        next(error);
    }
});

// ============== SECTION MANAGEMENT ==============

// GET /api/v1/admin/exams/:examId/sections
router.get('/exams/:examId/sections', async (req: AuthRequest, res, next) => {
    try {
        const { examId } = req.params;
        const sections = await prisma.section.findMany({
            where: { examId },
            orderBy: { order: 'asc' },
            include: {
                _count: { select: { questions: true } },
            },
        });
        res.json({ success: true, data: { sections } });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/admin/exams/:examId/sections
router.post('/exams/:examId/sections', async (req: AuthRequest, res, next) => {
    try {
        const { examId } = req.params;
        const { name, description, order } = req.body;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const section = await prisma.section.create({
            data: { name, slug, description, order: order || 0, examId },
        });
        res.status(201).json({ success: true, data: section });
    } catch (error) {
        next(error);
    }
});

// PUT /api/v1/admin/sections/:id
router.put('/sections/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const section = await prisma.section.update({ where: { id }, data: req.body });
        res.json({ success: true, data: section });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/admin/sections/:id
router.delete('/sections/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        await prisma.section.delete({ where: { id } });
        res.json({ success: true, message: 'Section deleted' });
    } catch (error) {
        next(error);
    }
});

// ============== QUESTION CRUD - DELETE ==============

// DELETE /api/v1/admin/questions/:id
// DELETE /api/v1/admin/questions/:id
router.delete('/questions/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        // Deep Delete: Remove dependencies manually (Schema missing some Cascades)
        await prisma.$transaction([
            // Remove from any Mock Tests
            prisma.testQuestion.deleteMany({ where: { questionId: id } }),
            // Remove from any User Attempts (Caution: modifies historical data)
            prisma.attemptAnswer.deleteMany({ where: { questionId: id } }),
            // Finally delete the question (Cascades handled by DB for others like Bookmarks if set)
            prisma.question.delete({ where: { id } })
        ]);

        res.json({ success: true, message: 'Question deleted' });
    } catch (error) {
        next(error);
    }
});

// ============== BOOK MANAGEMENT ==============

// GET /api/v1/admin/books
router.get('/books', async (req: AuthRequest, res, next) => {
    try {
        const { search, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { author: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const [books, total] = await Promise.all([
            prisma.book.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    author: true,
                    description: true,
                    coverUrl: true,
                    pdfUrl: true,
                    accessType: true,
                    createdAt: true,
                },
            }),
            prisma.book.count({ where }),
        ]);

        res.json({
            success: true,
            data: { books, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total } },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/admin/books
router.post('/books', async (req: AuthRequest, res, next) => {
    try {
        const data = req.body;
        // Clean up empty strings for optional relations
        if (data.subjectId === '') data.subjectId = null;
        if (data.category === '') data.category = null;

        const book = await prisma.book.create({ data });
        res.status(201).json({ success: true, data: book });
    } catch (error: any) {
        console.error('Create Book Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create book',
            error: { message: error.message, details: error }
        });
    }
});

// PUT /api/v1/admin/books/:id
router.put('/books/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.update({ where: { id }, data: req.body });
        res.json({ success: true, data: book });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/v1/admin/books/:id (partial update for status toggle)
router.patch('/books/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.update({ where: { id }, data: req.body });
        res.json({ success: true, data: book });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/admin/books/:id
router.delete('/books/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        await prisma.book.delete({ where: { id } });
        res.json({ success: true, message: 'Book deleted' });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/v1/admin/exams/:id (partial update for status toggle)
router.patch('/exams/:id', async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const exam = await prisma.exam.update({ where: { id }, data: req.body });
        res.json({ success: true, data: exam });
    } catch (error) {
        next(error);
    }
});

// ============== USER MANAGEMENT ==============

// GET /api/v1/admin/users
router.get('/users', async (req: AuthRequest, res, next) => {
    try {
        const { role, search, page = '1', limit = '20' } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { firstName: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    mobile: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                    lastLoginAt: true,
                    _count: { select: { attempts: true } },
                },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            data: { users, pagination: { currentPage: pageNum, totalPages: Math.ceil(total / limitNum), totalItems: total } },
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/v1/admin/users/:id/role
router.patch('/users/:id/role', authorize('SUPER_ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await prisma.user.update({ where: { id }, data: { role } });
        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/admin/users/:id
router.delete('/users/:id', authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        // Optional: Prevent deleting self
        if (id === req.user?.id) {
            return res.status(400).json({ success: false, error: { message: 'Cannot delete your own account' } });
        }

        // Deep Delete Operational Data
        await prisma.refreshToken.deleteMany({ where: { userId: id } });
        await prisma.testAttempt.deleteMany({ where: { userId: id } });
        await prisma.bookmark.deleteMany({ where: { userId: id } });
        try {
            // @ts-ignore
            if (prisma.downloadTicket) await prisma.downloadTicket.deleteMany({ where: { userId: id } });
        } catch (e) { }

        await prisma.payment.deleteMany({ where: { userId: id } });
        await prisma.subscription.deleteMany({ where: { userId: id } });

        await prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'User deleted' });
    } catch (error: any) {
        console.error('Delete User Error:', error);
        if (error.code === 'P2003') {
            return res.status(400).json({
                success: false,
                error: { message: 'Cannot delete user: They have linked content or financial records. Deactivate instead.' }
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete user',
            error: { message: error.message, details: error }
        });
    }
});

export default router;
