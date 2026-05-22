import { Request, Response } from 'express';
import express from 'express';
import multer from 'multer';
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

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: APP_CONFIG.MAX_FILE_SIZE,
    },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
            return callback(new Error('Only image files are allowed'));
        }
        callback(null, true);
    },
});

router.post(
    '/',
    uploadRateLimiter,
    authenticateToken,
    requireAdmin,
    upload.single('image'),
    async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'No image file provided');
            }

            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;

            const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                folder: 'bdshop_assets',
                resource_type: 'image',
            });

            logger.info(`Image uploaded to cloudinary: ${uploadResponse.secure_url}`);

            sendSuccessResponse(res, STATUS_CODES.OK, 'Image uploaded successfully', {
                url: uploadResponse.secure_url,
                public_id: uploadResponse.public_id,
            });
        } catch (error: Error | unknown) {
            logger.error('Error uploading image to cloudinary:', getErrorMessage(error));
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Image upload failed');
        }
    },
);

export default router;
