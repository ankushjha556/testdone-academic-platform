import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddefbv25t',
    api_key: process.env.CLOUDINARY_API_KEY || '895483545434799',
    api_secret: process.env.CLOUDINARY_API_SECRET || '8ap8FKClL7zJ6Dt4AWdjnFqcC_8',
});

export interface UploadResult {
    url: string;
    publicId: string;
    width?: number;
    height?: number;
}

/**
 * Upload an image to Cloudinary
 * @param file Base64 string or file path
 * @param folder Folder name in Cloudinary
 */
export async function uploadImage(file: string, folder: string = 'testdone'): Promise<UploadResult> {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { quality: 'auto', fetch_format: 'auto' }
            ]
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image');
    }
}

/**
 * Upload a PDF to Cloudinary
 */
export async function uploadPdf(file: string, folder: string = 'testdone/pdfs'): Promise<UploadResult> {
    try {
        const result = await cloudinary.uploader.upload(file, {
            folder: folder,
            resource_type: 'raw',
        });

        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error('Cloudinary PDF upload error:', error);
        throw new Error('Failed to upload PDF');
    }
}

/**
 * Delete a resource from Cloudinary
 */
export async function deleteResource(publicId: string, resourceType: 'image' | 'raw' = 'image'): Promise<boolean> {
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return true;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return false;
    }
}

export default cloudinary;
