import { Router } from 'express';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { uploadImage, uploadPdf, deleteResource } from '../lib/cloudinary';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for larger PDFs
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, GIF, and PDF are allowed.'));
        }
    }
});

// POST /api/v1/upload/image - Upload image to Cloudinary
router.post('/image', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'), upload.single('file'), async (req: AuthRequest, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded' }
            });
        }

        const folder = req.body.folder || 'testdone';

        // Convert buffer to base64 data URL
        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const result = await uploadImage(base64, folder);

        res.json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId,
                width: result.width,
                height: result.height
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/v1/upload/pdf - Upload PDF to Cloudinary
router.post('/pdf', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'), upload.single('file'), async (req: AuthRequest, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: { message: 'No file uploaded' }
            });
        }

        // Convert buffer to base64 data URL
        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const result = await uploadPdf(base64, 'testdone/pdfs');

        res.json({
            success: true,
            data: {
                url: result.url,
                publicId: result.publicId
            }
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/v1/upload - Delete resource from Cloudinary
router.delete('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res, next) => {
    try {
        const { publicId, resourceType = 'image' } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                error: { message: 'publicId is required' }
            });
        }

        const success = await deleteResource(publicId, resourceType as 'image' | 'raw');

        if (success) {
            res.json({
                success: true,
                message: 'Resource deleted successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: { message: 'Failed to delete resource' }
            });
        }
    } catch (error) {
        next(error);
    }
});

// Multer error handler for file size and type errors
router.use((err: any, req: any, res: any, next: any) => {
    if (err && err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                success: false,
                error: { message: 'File too large. Maximum size is 50MB for PDFs and 10MB for images.' }
            });
        }
        return res.status(400).json({
            success: false,
            error: { message: `Upload error: ${err.message}` }
        });
    }
    if (err) {
        return res.status(400).json({
            success: false,
            error: { message: err.message || 'Invalid file upload' }
        });
    }
    next();
});

export default router;
