import { Router, Request } from 'express';
import axios from 'axios';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/books - List books
router.get('/', async (req, res, next) => {
    try {
        const { category, subject, access, page = '1', limit = '20' } = req.query;

        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 50);
        const skip = (pageNum - 1) * limitNum;

        const where: any = {
            status: 'PUBLISHED',
        };

        if (category) {
            where.category = category;
        }

        if (subject) {
            where.subject = { slug: subject };
        }

        if (access) {
            where.accessType = access;
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
                    pages: true,
                    sizeMb: true,
                    category: true,
                    accessType: true,
                    downloadsCount: true,
                    rating: true,
                    subject: {
                        select: { id: true, name: true, slug: true },
                    },
                },
            }),
            prisma.book.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                books,
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

// GET /api/v1/books/:id - Get book details
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                author: true,
                description: true,
                coverUrl: true,
                pdfUrl: true,
                pages: true,
                sizeMb: true,
                category: true,
                accessType: true,
                downloadsCount: true,
                rating: true,
                subject: {
                    select: { id: true, name: true, slug: true },
                },
            },
        });

        if (!book) {
            return res.status(404).json({
                success: false,
                error: { message: 'Book not found' },
            });
        }

        res.json({
            success: true,
            data: { book },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/books/:id/download-ticket - Generate One-Time Ticket
router.post('/:id/download-ticket', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.findUnique({ where: { id } });

        if (!book) {
            return res.status(404).json({ success: false, error: { message: 'Book not found' } });
        }

        // Check Premium
        if (book.accessType === 'PREMIUM') {
            const hasSubscription = await prisma.subscription.findFirst({
                where: { userId: req.user!.id, status: 'ACTIVE', endDate: { gt: new Date() } }
            });
            if (!hasSubscription && !['SUPER_ADMIN', 'ADMIN'].includes(req.user!.role)) {
                return res.status(403).json({ success: false, error: { message: 'Subscription required' }, errorCode: 'SUBSCRIPTION_REQUIRED' });
            }
        }

        // Generate Ticket
        const ticket = await prisma.downloadTicket.create({
            data: {
                userId: req.user!.id,
                bookId: id,
                token: require('crypto').randomBytes(32).toString('hex'),
                expiresAt: new Date(Date.now() + 60 * 1000) // 1 minute validity
            }
        });

        res.json({ success: true, data: { ticket: ticket.token } });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/books/:id/download - Consume Ticket & Stream
router.get('/:id/download', async (req: Request, res, next) => {
    try {
        const { id } = req.params;
        const { ticket } = req.query;

        if (!ticket || typeof ticket !== 'string') {
            return res.status(400).json({ success: false, error: { message: 'Missing ticket' } });
        }

        // Verify & Consume Ticket
        const validTicket = await prisma.downloadTicket.findUnique({
            where: { token: ticket },
            include: { book: true, user: true } // Include book to get URL and title
        });

        if (!validTicket || validTicket.used || validTicket.expiresAt < new Date()) {
            return res.status(403).json({ success: false, error: { message: 'Invalid or expired ticket' } });
        }

        if (validTicket.bookId !== id) {
            return res.status(403).json({ success: false, error: { message: 'Ticket mismatch' } });
        }

        // Mark Used
        await prisma.downloadTicket.update({
            where: { id: validTicket.id },
            data: { used: true }
        });

        await prisma.book.update({
            where: { id },
            data: { downloadsCount: { increment: 1 } },
        });

        const book = validTicket.book;
        const safeTitle = book.title.replace(/[^a-zA-Z0-9-_ ]/g, '').trim() || 'Book';
        const filename = `TestDone_${safeTitle}.pdf`;

        // Stream File
        const streamRes = await axios({
            url: book.pdfUrl!,
            method: 'GET',
            responseType: 'stream'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        streamRes.data.pipe(res);

    } catch (error) {
        next(error);
    }
});

export default router;
