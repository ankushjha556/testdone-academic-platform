import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;
        let token = '';

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query && req.query.token) {
            token = req.query.token as string;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: { message: 'No token provided' },
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
                userId: string;
                email: string;
                role: string;
            };

            // Verify user exists
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

            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
            };

            next();
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: { message: 'Invalid or expired token' },
            });
        }
    } catch (error) {
        next(error);
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: { message: 'Not authenticated' },
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Not authorized to access this resource' },
            });
        }

        next();
    };
};

export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];

            try {
                const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
                    userId: string;
                    email: string;
                    role: string;
                };

                req.user = {
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                };
            } catch {
                // Token invalid, continue without user
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};
