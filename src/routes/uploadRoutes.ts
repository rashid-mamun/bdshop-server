import { Request, Response } from 'express';
import express from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import cloudinary from '../config/cloudinary';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response';
import { STATUS_CODES } from '../constants/statusCodes';
import { logger } from '../utils/logger';
import { APP_CONFIG } from '../constants/config';
import environment from '../config/environment';
import {
    assertPendingUploadQuota,
    cleanupExpiredPendingUploads,
    registerPendingUpload,
} from '../services/uploadAssetService';

const router = express.Router();

type RequestWithUser = Request & {
    user?: {
        email?: string;
    };
};

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: APP_CONFIG.MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, callback) => {
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) {
            return callback(new Error('Only JPG, PNG, GIF, and WebP image files are allowed'));
        }
        callback(null, true);
    },
});

const extensionByMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
};

const saveLocalImage = async (req: Request) => {
    if (!req.file) {
        throw new Error('No image file provided');
    }

    const uploadDir = path.resolve(process.cwd(), environment.UPLOAD_PATH, 'pending');
    await fs.mkdir(uploadDir, { recursive: true });

    const ext =
        extensionByMime[req.file.mimetype] ||
        path.extname(req.file.originalname).toLowerCase() ||
        '.jpg';
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, req.file.buffer);

    return {
        url: `${req.protocol}://${req.get('host')}/${environment.UPLOAD_PATH.replace(/\\/g, '/').replace(/\/$/, '')}/pending/${filename}`,
        public_id: `pending/${filename}`,
        storage: 'local',
    };
};

router.post(
    '/',
    uploadRateLimiter,
    authenticateToken,
    upload.single('image'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'No image file provided');
            }
            const ownerEmail = (req as RequestWithUser).user?.email;
            if (!ownerEmail) {
                return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'User email not found');
            }

            await assertPendingUploadQuota(ownerEmail);

            try {
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${b64}`;

                const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                    folder: 'bdshop_assets/pending',
                    resource_type: 'image',
                });

                logger.info(`Image uploaded to cloudinary: ${uploadResponse.secure_url}`);

                await registerPendingUpload({
                    ownerEmail,
                    url: uploadResponse.secure_url,
                    publicId: uploadResponse.public_id,
                    storage: 'cloudinary',
                });

                return sendSuccessResponse(res, STATUS_CODES.OK, 'Image uploaded successfully', {
                    url: uploadResponse.secure_url,
                    public_id: uploadResponse.public_id,
                    storage: 'cloudinary',
                });
            } catch (cloudinaryError: Error | unknown) {
                logger.warn(
                    `Cloudinary upload failed, saving locally: ${getErrorMessage(cloudinaryError)}`,
                );
                const localUpload = await saveLocalImage(req);
                await registerPendingUpload({
                    ownerEmail,
                    url: localUpload.url,
                    publicId: localUpload.public_id,
                    storage: 'local',
                });
                logger.info(`Image saved locally: ${localUpload.url}`);
                return sendSuccessResponse(
                    res,
                    STATUS_CODES.OK,
                    'Image uploaded successfully',
                    localUpload,
                );
            }
        } catch (error: Error | unknown) {
            if (getErrorMessage(error).includes('unsaved uploads')) {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.TOO_MANY_REQUESTS,
                    getErrorMessage(error),
                );
            }
            logger.error('Error uploading image to cloudinary:', getErrorMessage(error));
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Image upload failed');
        }
    },
);

router.delete('/pending/expired', authenticateToken, requireAdmin, async (_req, res) => {
    await cleanupExpiredPendingUploads();
    sendSuccessResponse(res, STATUS_CODES.OK, 'Expired pending uploads cleaned up');
});

export default router;
