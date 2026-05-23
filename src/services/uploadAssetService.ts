import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary';
import environment from '../config/environment';
import UploadedAsset from '../models/uploadedAssets';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

export const PENDING_UPLOAD_TTL_MS = 15 * 60 * 1000;
export const MAX_PENDING_UPLOADS_PER_ADMIN = 10;

type StoredImage = {
    url?: string;
    publicId?: string;
    storage?: string;
};

const getLocalFilenameFromUrl = (url?: string) => {
    if (!url) return '';
    const marker = '/uploads/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex === -1) return '';
    return decodeURIComponent(url.slice(markerIndex + marker.length).split(/[?#]/)[0] || '');
};

export const deleteStoredImage = async (image: StoredImage) => {
    const storage = image.storage || (image.url?.includes('/uploads/') ? 'local' : '');
    const publicId = image.publicId || (storage === 'local' ? getLocalFilenameFromUrl(image.url) : '');

    if (!publicId) return;

    try {
        if (storage === 'cloudinary') {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
            logger.info(`Cloudinary image deleted: ${publicId}`);
        } else if (storage === 'local') {
            const uploadDir = path.resolve(process.cwd(), environment.UPLOAD_PATH);
            const imagePath = path.resolve(uploadDir, publicId);
            if (!imagePath.startsWith(uploadDir)) {
                logger.warn(`Skipped local image delete outside upload dir: ${publicId}`);
                return;
            }
            await fs.unlink(imagePath).catch((error: any) => {
                if (error?.code !== 'ENOENT') throw error;
            });
            logger.info(`Local image deleted: ${publicId}`);
        }

        await UploadedAsset.deleteOne({ publicId, storage });
    } catch (error: Error | unknown) {
        logger.warn(`Image cleanup failed for ${publicId}: ${getErrorMessage(error)}`);
    }
};

export const cleanupExpiredPendingUploads = async () => {
    const expiredAssets = await UploadedAsset.find({
        status: 'pending',
        expiresAt: { $lte: new Date() },
    }).limit(50);

    for (const asset of expiredAssets) {
        await deleteStoredImage({
            url: asset.url,
            publicId: asset.publicId,
            storage: asset.storage,
        });
    }
};

export const assertPendingUploadQuota = async (ownerEmail: string) => {
    await cleanupExpiredPendingUploads();

    const pendingCount = await UploadedAsset.countDocuments({
        ownerEmail,
        status: 'pending',
        expiresAt: { $gt: new Date() },
    });

    if (pendingCount >= MAX_PENDING_UPLOADS_PER_ADMIN) {
        throw new Error(
            `You have ${pendingCount} unsaved uploads. Save a product or wait for cleanup before uploading more.`,
        );
    }
};

export const registerPendingUpload = async ({
    ownerEmail,
    url,
    publicId,
    storage,
}: {
    ownerEmail: string;
    url: string;
    publicId: string;
    storage: 'cloudinary' | 'local';
}) => {
    return UploadedAsset.create({
        ownerEmail,
        url,
        publicId,
        storage,
        status: 'pending',
        expiresAt: new Date(Date.now() + PENDING_UPLOAD_TTL_MS),
    });
};

export const markUploadAttached = async ({
    publicId,
    storage,
    serviceId,
}: {
    publicId?: string;
    storage?: string;
    serviceId: string | mongoose.Types.ObjectId;
}) => {
    if (!publicId || (storage !== 'cloudinary' && storage !== 'local')) return;

    await UploadedAsset.updateOne(
        { publicId, storage },
        {
            status: 'attached',
            attachedServiceId: serviceId,
            $unset: { expiresAt: '' },
        },
    );
};

export const promotePendingUpload = async ({
    publicId,
    storage,
    serviceId,
}: {
    publicId?: string;
    storage?: string;
    serviceId: string | mongoose.Types.ObjectId;
}) => {
    if (!publicId || (storage !== 'cloudinary' && storage !== 'local')) return null;

    const asset = await UploadedAsset.findOne({ publicId, storage, status: 'pending' });
    if (!asset) {
        await markUploadAttached({ publicId, storage, serviceId });
        return null;
    }

    if (storage === 'cloudinary') {
        const filename = path.posix.basename(publicId);
        const promotedPublicId = `bdshop_assets/products/${filename}`;
        const promoted = await cloudinary.uploader.rename(publicId, promotedPublicId, {
            resource_type: 'image',
            overwrite: true,
        });

        await UploadedAsset.updateOne(
            { _id: asset._id },
            {
                publicId: promoted.public_id,
                url: promoted.secure_url,
                status: 'attached',
                attachedServiceId: serviceId,
                $unset: { expiresAt: '' },
            },
        );

        return {
            url: promoted.secure_url as string,
            publicId: promoted.public_id as string,
            storage,
        };
    }

    const filename = path.basename(publicId);
    const uploadRoot = path.resolve(process.cwd(), environment.UPLOAD_PATH);
    const pendingPath = path.resolve(uploadRoot, publicId);
    const productsDir = path.resolve(uploadRoot, 'products');
    const promotedPublicId = `products/${filename}`;
    const promotedPath = path.resolve(uploadRoot, promotedPublicId);

    if (!pendingPath.startsWith(uploadRoot) || !promotedPath.startsWith(uploadRoot)) {
        throw new Error('Invalid local upload path');
    }

    await fs.mkdir(productsDir, { recursive: true });
    await fs.rename(pendingPath, promotedPath);

    const promotedUrl = asset.url.replace('/uploads/pending/', '/uploads/products/');
    await UploadedAsset.updateOne(
        { _id: asset._id },
        {
            publicId: promotedPublicId,
            url: promotedUrl,
            status: 'attached',
            attachedServiceId: serviceId,
            $unset: { expiresAt: '' },
        },
    );

    return {
        url: promotedUrl,
        publicId: promotedPublicId,
        storage,
    };
};

export const startUploadCleanupJob = () => {
    const interval = setInterval(() => {
        cleanupExpiredPendingUploads().catch((error) => {
            logger.warn(`Pending upload cleanup failed: ${getErrorMessage(error)}`);
        });
    }, 15 * 60 * 1000);

    interval.unref?.();
    return interval;
};
