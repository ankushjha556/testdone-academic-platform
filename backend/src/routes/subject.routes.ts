import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET /api/v1/subjects - List all subjects
router.get('/', async (req, res, next) => {
    try {
        const subjects = await prisma.subject.findMany({
            orderBy: { order: 'asc' },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                color: true,
                _count: {
                    select: {
                        topics: true,
                        questions: true,
                    },
                },
            },
        });

        res.json({
            success: true,
            data: subjects.map(s => ({
                ...s,
                topicsCount: s._count.topics,
                questionsCount: s._count.questions,
                _count: undefined,
            })),
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/subjects/:slug/topics - Get topics for a subject
router.get('/:slug/topics', async (req, res, next) => {
    try {
        const { slug } = req.params;

        const subject = await prisma.subject.findUnique({
            where: { slug },
            include: {
                topics: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        _count: {
                            select: { questions: true },
                        },
                    },
                },
            },
        });

        if (!subject) {
            return res.status(404).json({
                success: false,
                error: { message: 'Subject not found' },
            });
        }

        res.json({
            success: true,
            data: {
                subject: {
                    id: subject.id,
                    name: subject.name,
                    slug: subject.slug,
                },
                topics: subject.topics.map(t => ({
                    id: t.id,
                    name: t.name,
                    slug: t.slug,
                    questionsCount: t._count.questions,
                })),
            },
        });
    } catch (error) {
        next(error);
    }
});

export default router;
