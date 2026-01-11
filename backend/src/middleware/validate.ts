import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema<any>) => (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                error: {
                    message: 'Invalid input data',
                    details: error.issues // .errors or .issues depending on version, issues is standard prop
                },
                errorCode: 'VALIDATION_ERROR'
            });
        }
        next(error);
    }
};
