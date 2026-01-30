import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { logMistakesFromAttempt } from '../lib/mistakeLogger';
import { refreshWeaknessSnapshotAsync } from '../lib/weaknessProfiler';

const router = Router();

// GET /api/v1/tests - List all tests
router.get('/', async (req, res, next) => {
    try {
        const {
            exam,
            type,
            access,
            page = '1',
            limit = '20',
        } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 50);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            status: 'PUBLISHED',
        };

        if (exam) {
            where.exam = { slug: exam };
        }

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
                    exam: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
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

// GET /api/v1/tests/info/:slug - Get public test info (no auth required) for SEO/preview
router.get('/info/:slug', async (req, res, next) => {
    try {
        const { slug } = req.params;

        // Check if input is a valid UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

        const test = await prisma.mockTest.findFirst({
            where: {
                OR: [
                    { slug },
                    ...(isUuid ? [{ id: slug }] : [])
                ]
            },
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
                instructions: true,
                exam: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { attempts: true },
                },
            },
        });

        if (!test) {
            return res.status(404).json({
                success: false,
                error: { message: 'Test not found' },
            });
        }

        res.json({
            success: true,
            data: {
                ...test,
                attemptsCount: test._count.attempts,
                _count: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/tests/:slug - Get test details (authenticated)
router.get('/:slug', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { slug } = req.params;

        const test = await prisma.mockTest.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                testType: true,
                totalQuestions: true,
                totalMarks: true,
                durationMinutes: true,
                sectionalTiming: true,
                sections: true,
                negativeMarking: true,
                accessType: true,
                isAllIndia: true,
                instructions: true,
                exam: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                _count: {
                    select: { attempts: true },
                },
            },
        });

        if (!test) {
            return res.status(404).json({
                success: false,
                error: { message: 'Test not found' },
            });
        }

        // Check access for premium tests
        if (test.accessType === 'PREMIUM') {
            const hasSubscription = await prisma.subscription.findFirst({
                where: {
                    userId: req.user!.id,
                    status: 'ACTIVE',
                    endDate: { gt: new Date() },
                },
            });

            if (!hasSubscription && !['SUPER_ADMIN', 'ADMIN'].includes(req.user!.role)) {
                return res.status(403).json({
                    success: false,
                    error: { message: 'Premium subscription required' },
                });
            }
        }

        // Get user's previous attempts
        const userAttempts = await prisma.testAttempt.findMany({
            where: {
                userId: req.user!.id,
                testId: test.id,
                status: 'COMPLETED',
            },
            orderBy: { completedAt: 'desc' },
            take: 5,
            select: {
                id: true,
                totalScore: true,
                completedAt: true,
                allIndiaRank: true,
            },
        });

        res.json({
            success: true,
            data: {
                ...test,
                attemptsCount: test._count.attempts,
                userAttempts,
                _count: undefined,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/tests/:testId/start - Start a test attempt
router.post('/:testId/start', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { testId } = req.params;

        // Get test with questions
        const test = await prisma.mockTest.findUnique({
            where: { id: testId },
            include: {
                testQuestions: {
                    orderBy: [{ sectionIndex: 'asc' }, { questionOrder: 'asc' }],
                    include: {
                        question: {
                            select: {
                                id: true,
                                questionText: true,
                                questionType: true,
                                options: true,
                                conceptNote: true, // For passages in comprehension questions
                            },
                        },
                    },
                },
            },
        });

        if (!test) {
            return res.status(404).json({
                success: false,
                error: { message: 'Test not found' },
            });
        }

        // Check if there's an in-progress attempt
        const existingAttempt = await prisma.testAttempt.findFirst({
            where: {
                userId: req.user!.id,
                testId,
                status: 'IN_PROGRESS',
            },
        });

        if (existingAttempt) {
            // Return existing attempt
            const answers = await prisma.attemptAnswer.findMany({
                where: { attemptId: existingAttempt.id },
            });

            return res.json({
                success: true,
                data: {
                    attemptId: existingAttempt.id,
                    testId: test.id,
                    questions: test.testQuestions.map(tq => ({
                        id: tq.question.id,
                        questionText: tq.question.questionText,
                        questionType: tq.question.questionType,
                        options: tq.question.options,
                        passage: tq.question.conceptNote || null, // Passage for comprehension
                        sectionIndex: tq.sectionIndex,
                        questionOrder: tq.questionOrder,
                        marks: tq.marks,
                    })),
                    sections: test.sections,
                    startedAt: existingAttempt.startedAt,
                    expiresAt: new Date(existingAttempt.startedAt.getTime() + test.durationMinutes * 60 * 1000),
                    serverTime: new Date(),
                    savedAnswers: answers.reduce((acc, a) => {
                        acc[a.questionId] = a.selectedOption;
                        return acc;
                    }, {} as Record<string, string | null>),
                },
            });
        }

        // Create new attempt
        const attempt = await prisma.testAttempt.create({
            data: {
                userId: req.user!.id,
                testId,
            },
        });

        // Pre-create answer records
        await prisma.attemptAnswer.createMany({
            data: test.testQuestions.map(tq => ({
                attemptId: attempt.id,
                questionId: tq.questionId,
            })),
        });

        res.status(201).json({
            success: true,
            data: {
                attemptId: attempt.id,
                testId: test.id,
                questions: test.testQuestions.map(tq => ({
                    id: tq.question.id,
                    questionText: tq.question.questionText,
                    questionType: tq.question.questionType,
                    options: tq.question.options,
                    passage: tq.question.conceptNote || null, // Passage for comprehension
                    sectionIndex: tq.sectionIndex,
                    questionOrder: tq.questionOrder,
                    marks: tq.marks,
                })),
                sections: test.sections,
                startedAt: attempt.startedAt,
                expiresAt: new Date(attempt.startedAt.getTime() + test.durationMinutes * 60 * 1000),
                serverTime: new Date(),
                savedAnswers: {},
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/tests/attempts/:attemptId/answer - Save answer
router.post('/attempts/:attemptId/answer', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { attemptId } = req.params;
        const { questionId, selectedOption, isMarkedReview, timeSpentSeconds } = req.body;

        // Verify attempt belongs to user
        const attempt = await prisma.testAttempt.findFirst({
            where: {
                id: attemptId,
                userId: req.user!.id,
                status: 'IN_PROGRESS',
            },
        });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: { message: 'Attempt not found or already completed' },
            });
        }

        // Update answer
        await prisma.attemptAnswer.update({
            where: {
                attemptId_questionId: {
                    attemptId,
                    questionId,
                },
            },
            data: {
                selectedOption,
                isMarkedReview: isMarkedReview || false,
                timeSpentSeconds,
                answeredAt: selectedOption ? new Date() : null,
            },
        });

        res.json({
            success: true,
            message: 'Answer saved',
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/tests/attempts/:attemptId/submit - Submit test
router.post('/attempts/:attemptId/submit', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { attemptId } = req.params;

        // Get attempt with answers
        const attempt = await prisma.testAttempt.findFirst({
            where: {
                id: attemptId,
                userId: req.user!.id,
            },
            include: {
                test: {
                    include: {
                        testQuestions: {
                            include: {
                                question: {
                                    select: {
                                        id: true,
                                        correctAnswer: true,
                                        options: true,
                                        difficulty: true,
                                        subjectId: true,
                                        topicId: true,
                                    },
                                },
                            },
                        },
                    },
                },
                answers: true,
            },
        });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: { message: 'Attempt not found' },
            });
        }

        if (attempt.status === 'COMPLETED') {
            return res.status(400).json({
                success: false,
                error: { message: 'Test already submitted' },
            });
        }

        // Calculate scores
        const negativeMarking = Number(attempt.test.negativeMarking);
        let totalScore = 0;
        let correctCount = 0;
        let incorrectCount = 0;
        let unattemptedCount = 0;

        const answerUpdates = [];

        for (const answer of attempt.answers) {
            const testQuestion = attempt.test.testQuestions.find(tq => tq.questionId === answer.questionId);
            if (!testQuestion) continue;

            const question = testQuestion.question;
            const marks = Number(testQuestion.marks);

            if (!answer.selectedOption) {
                unattemptedCount++;
                answerUpdates.push({
                    where: { id: answer.id },
                    data: { isCorrect: null, marksObtained: 0 },
                });
            } else if (answer.selectedOption === question.correctAnswer) {
                correctCount++;
                totalScore += marks;
                answerUpdates.push({
                    where: { id: answer.id },
                    data: { isCorrect: true, marksObtained: marks },
                });
            } else {
                incorrectCount++;
                totalScore -= negativeMarking;
                answerUpdates.push({
                    where: { id: answer.id },
                    data: { isCorrect: false, marksObtained: -negativeMarking },
                });
            }
        }

        // Update all answers
        await Promise.all(
            answerUpdates.map(update => prisma.attemptAnswer.update(update))
        );

        // Log mistakes to UserMistakeLog (async, non-blocking)
        // This runs in the background and doesn't affect response time
        const answersWithQuestions = attempt.answers.map(answer => {
            const testQuestion = attempt.test.testQuestions.find(tq => tq.questionId === answer.questionId);
            const answerUpdate = answerUpdates.find(u => u.where.id === answer.id);
            return {
                questionId: answer.questionId,
                selectedOption: answer.selectedOption,
                isCorrect: answerUpdate?.data.isCorrect ?? null,
                timeSpentSeconds: answer.timeSpentSeconds,
                question: testQuestion!.question,
            };
        });

        logMistakesFromAttempt(
            {
                id: attempt.id,
                userId: req.user!.id,
                testId: attempt.testId,
                test: { examId: attempt.test.examId },
            },
            answersWithQuestions
        ).catch(err => console.error('[MistakeLogger] Background logging failed:', err));

        // Refresh weakness snapshot in background (non-blocking)
        refreshWeaknessSnapshotAsync(req.user!.id);

        const timeTaken = Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000);

        // Calculate rank for All-India tests
        let allIndiaRank = null;
        let percentile = null;

        if (attempt.test.isAllIndia) {
            const betterScores = await prisma.testAttempt.count({
                where: {
                    testId: attempt.testId,
                    status: 'COMPLETED',
                    totalScore: { gt: totalScore },
                },
            });
            allIndiaRank = betterScores + 1;

            const totalAttempts = await prisma.testAttempt.count({
                where: {
                    testId: attempt.testId,
                    status: 'COMPLETED',
                },
            });
            percentile = ((totalAttempts - allIndiaRank + 1) / totalAttempts) * 100;
        }

        // Update attempt
        const updatedAttempt = await prisma.testAttempt.update({
            where: { id: attemptId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                timeTakenSeconds: timeTaken,
                totalScore,
                correctCount,
                incorrectCount,
                unattemptedCount,
                allIndiaRank,
                percentile,
            },
        });

        res.json({
            success: true,
            data: {
                attemptId: updatedAttempt.id,
                totalScore,
                maxScore: Number(attempt.test.totalMarks),
                correctCount,
                incorrectCount,
                unattemptedCount,
                timeTakenSeconds: timeTaken,
                accuracy: correctCount > 0 ? (correctCount / (correctCount + incorrectCount)) * 100 : 0,
                allIndiaRank,
                percentile,
            },
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/tests/results/:attemptId - Get result details
router.get('/results/:attemptId', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { attemptId } = req.params;

        const attempt = await prisma.testAttempt.findFirst({
            where: {
                id: attemptId,
                userId: req.user!.id,
                status: 'COMPLETED',
            },
            include: {
                test: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        totalMarks: true,
                        sections: true,
                        exam: {
                            select: { id: true, name: true, slug: true },
                        },
                        // Include testQuestions to get order
                        testQuestions: {
                            select: {
                                questionId: true,
                                questionOrder: true,
                            }
                        }
                    },
                },
                answers: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                questionText: true,
                                options: true,
                                correctAnswer: true,
                                solution: true,
                                conceptNote: true,
                                subject: { select: { name: true } },
                                topic: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!attempt) {
            return res.status(404).json({
                success: false,
                error: { message: 'Result not found' },
            });
        }

        // Sort answers by questionOrder
        const orderMap = new Map<string, number>();
        // @ts-ignore - testQuestions is included but type inference implies select might limit it, but prisma result has it
        if (attempt.test.testQuestions) {
            // @ts-ignore
            attempt.test.testQuestions.forEach((tq: any) => orderMap.set(tq.questionId, tq.questionOrder));
        }

        const sortedAnswers = [...attempt.answers].sort((a, b) => {
            const orderA = orderMap.get(a.questionId) ?? 9999;
            const orderB = orderMap.get(b.questionId) ?? 9999;
            return orderA - orderB;
        });

        // Calculate topic-wise analysis
        const topicAnalysis: Record<string, { correct: number; total: number }> = {};
        for (const answer of sortedAnswers) {
            const topicName = answer.question.topic?.name || 'General';
            if (!topicAnalysis[topicName]) {
                topicAnalysis[topicName] = { correct: 0, total: 0 };
            }
            topicAnalysis[topicName].total++;
            if (answer.isCorrect) {
                topicAnalysis[topicName].correct++;
            }
        }

        res.json({
            success: true,
            data: {
                attemptId: attempt.id,
                test: {
                    ...attempt.test,
                    testQuestions: undefined // Remove from response to keep it clean
                },
                score: attempt.totalScore,
                maxScore: attempt.test.totalMarks,
                correctCount: attempt.correctCount,
                incorrectCount: attempt.incorrectCount,
                unattemptedCount: attempt.unattemptedCount,
                timeTakenSeconds: attempt.timeTakenSeconds,
                percentage: (Number(attempt.totalScore) / Number(attempt.test.totalMarks)) * 100,
                allIndiaRank: attempt.allIndiaRank,
                percentile: attempt.percentile,
                topicAnalysis: Object.entries(topicAnalysis).map(([topic, data]) => ({
                    topic,
                    correct: data.correct,
                    total: data.total,
                    accuracy: (data.correct / data.total) * 100,
                })),
                answers: sortedAnswers.map(a => ({
                    questionId: a.questionId,
                    questionText: a.question.questionText,
                    options: a.question.options,
                    selectedOption: a.selectedOption,
                    correctAnswer: a.question.correctAnswer,
                    isCorrect: a.isCorrect,
                    solution: a.question.solution,
                    conceptNote: a.question.conceptNote,
                    timeSpent: a.timeSpentSeconds,
                })),
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
