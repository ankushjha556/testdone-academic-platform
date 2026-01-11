import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { OAuth2Client } from 'google-auth-library';


const router = Router();

// Generate tokens
const generateTokens = (userId: string, email: string, role: string) => {
    const accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    const refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

    const accessToken = jwt.sign(
        { userId, email, role },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: accessExpiry } as SignOptions
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: refreshExpiry } as SignOptions
    );

    return { accessToken, refreshToken };
};

// Validation middleware
const signupValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').trim().notEmpty().withMessage('First name is required'),
];

const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

// POST /api/v1/auth/signup
router.post('/signup', signupValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() },
            });
        }

        const { email, password, firstName, lastName, mobile, targetExamId } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    ...(mobile ? [{ mobile }] : []),
                ],
            },
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: { message: 'User with this email or mobile already exists' },
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                mobile,
                targetExamId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            },
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user,
                accessToken,
                refreshToken,
                expiresIn: 900, // 15 minutes
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/login
router.post('/login', loginValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: { message: 'Validation failed', details: errors.array() },
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
                isEmailVerified: true,
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    orderBy: { endDate: 'desc' },
                    take: 1,
                },
            },
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid email or password' },
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid email or password' },
            });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                    subscriptionStatus: user.subscriptions.length > 0 ? 'premium' : 'free',
                },
                accessToken,
                refreshToken,
                expiresIn: 900,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                error: { message: 'Refresh token required' },
            });
        }

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
        } catch {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid refresh token' },
            });
        }

        // Check if token exists in database
        const storedToken = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                userId: decoded.userId,
                expiresAt: { gt: new Date() },
            },
        });

        if (!storedToken) {
            return res.status(401).json({
                success: false,
                error: { message: 'Refresh token expired or revoked' },
            });
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: { message: 'User not found' },
            });
        }

        // Generate new access token
        // @ts-ignore
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email, role: user.role } as any,
            process.env.JWT_ACCESS_SECRET!,
            { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
        );

        res.json({
            success: true,
            data: {
                accessToken,
                expiresIn: 900,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { refreshToken } = req.body;

        // Delete refresh token
        if (refreshToken) {
            await prisma.refreshToken.deleteMany({
                where: {
                    token: refreshToken,
                    userId: req.user!.id,
                },
            });
        }

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
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
                isEmailVerified: true,
                isMobileVerified: true,
                targetExam: {
                    select: { id: true, name: true, slug: true },
                },
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    orderBy: { endDate: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        endDate: true,
                        plan: { select: { name: true } },
                    },
                },
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { message: 'User not found' },
            });
        }

        res.json({
            success: true,
            data: {
                ...user,
                subscriptionStatus: user.subscriptions.length > 0 ? 'premium' : 'free',
            },
        });
    } catch (error) {
        next(error);
    }
});
// POST /api/v1/auth/google
router.post('/google', async (req, res, next) => {
    try {
        const { token } = req.body;

        // Verify Access Token via Google UserInfo Endpoint
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!userInfoRes.ok) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid Google Token' },
            });
        }

        const payload = await userInfoRes.json() as any;

        if (!payload || !payload.email) {
            return res.status(400).json({
                success: false,
                error: { message: 'Could not retrieve email from Google' },
            });
        }

        const { email, sub: googleId, given_name: firstName, family_name: lastName, picture: avatarUrl } = payload;

        // Check if user exists
        let user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            // Create New User via Google
            user = await prisma.user.create({
                data: {
                    email,
                    firstName: firstName || 'User',
                    lastName: lastName || '',
                    avatarUrl,
                    passwordHash: '', // No password for OAuth
                    isEmailVerified: true,
                    role: 'FREE_USER',
                    oauthProvider: 'GOOGLE',
                    oauthId: googleId,
                },
            });
        } else {
            // Link Google Account if not linked
            if (!user.oauthId) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        oauthProvider: 'GOOGLE',
                        oauthId: googleId,
                        isEmailVerified: true, // Google verifies email
                        avatarUrl: user.avatarUrl || avatarUrl,
                    },
                });
            }
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                    // Handle subscription safely if included in relation above (it's not fetched here yet, assuming basic User)
                },
                accessToken,
                refreshToken,
                expiresIn: 900,
            },
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({
            success: false,
            error: { message: 'Google Authentication Failed' },
        });
    }
});

export default router;
