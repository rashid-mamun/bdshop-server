import Service from '../models/services';
import { deleteStoredImage, promotePendingUpload } from './uploadAssetService';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { IService } from '../types';
import { logger } from '../utils/logger';
import { APP_CONFIG } from '../constants/config';
import { notifyBackInStock } from './stockNotificationService';

type ServiceFilters = {
    category?: string;
    search?: string;
    minPrice?: string | number;
    maxPrice?: string | number;
    featured?: boolean | string;
    flashDeal?: boolean | string;
    newArrival?: boolean | string;
    rating?: string | number;
    inStock?: boolean | string;
};

type QueryOptions = {
    page?: string | number;
    limit?: string | number;
    sort?: string;
};

const serviceService = {
    async createService(serviceData: Partial<IService>) {
        try {
            const service = new Service(serviceData);
            const savedService = await service.save();
            const promotedImage = await promotePendingUpload({
                publicId: savedService.imgPublicId,
                storage: savedService.imgStorage,
                serviceId: savedService._id,
            });
            if (promotedImage) {
                savedService.img = promotedImage.url;
                savedService.imgPublicId = promotedImage.publicId;
                savedService.imgStorage = promotedImage.storage as any;
                savedService.images = [promotedImage.url];
                await savedService.save();
            }
            logger.info('Service created:', savedService._id);
            return savedService;
        } catch (error: any) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Create service error:', errorMessage);
            throw error;
        }
    },

    async getServiceById(id: string) {
        try {
            const service = await Service.findById(id);
            if (!service) throw new Error('Service not found');
            return service;
        } catch (error: any) {
            logger.error('Get service error:', getErrorMessage(error));
            throw error;
        }
    },

    async getAllServices(filters: ServiceFilters = {}, options: QueryOptions = {}) {
        try {
            const requestedPage = Number(options.page ?? 1);
            const requestedLimit = Number(options.limit ?? 12);
            const currentPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
            const pageSize = Math.min(
                APP_CONFIG.MAX_PAGE_SIZE,
                Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 12),
            );
            const skip = (currentPage - 1) * pageSize;

            const query: any = {};
            if (filters.category) query.category = filters.category;
            if (filters.search) query.$text = { $search: filters.search };
            if (filters.featured === 'true' || filters.featured === true) query.isFeatured = true;
            if (filters.flashDeal === 'true' || filters.flashDeal === true)
                query.isFlashDeal = true;
            if (filters.newArrival === 'true' || filters.newArrival === true)
                query.isNewArrival = true;
            if (filters.rating) query.averageRating = { $gte: Number(filters.rating) };
            if (filters.inStock === 'true' || filters.inStock === true) query.stock = { $gt: 0 };

            if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
                query.price = {};
                if (filters.minPrice !== undefined && filters.minPrice !== '')
                    query.price.$gte = Number(filters.minPrice);
                if (filters.maxPrice !== undefined && filters.maxPrice !== '')
                    query.price.$lte = Number(filters.maxPrice);
                if (Object.keys(query.price).length === 0) delete query.price;
            }

            let sortQuery: any = { createdAt: -1 };
            if (options.sort === 'price_asc') sortQuery = { price: 1 };
            else if (options.sort === 'price_desc') sortQuery = { price: -1 };
            else if (options.sort === 'newest') sortQuery = { createdAt: -1 };
            else if (options.sort === 'rating') sortQuery = { averageRating: -1 };
            else if (options.sort === 'popular') sortQuery = { reviewCount: -1 };

            const [services, total] = await Promise.all([
                Service.find(query).sort(sortQuery).skip(skip).limit(pageSize),
                Service.countDocuments(query),
            ]);

            return {
                services,
                pagination: {
                    page: currentPage,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize),
                },
            };
        } catch (error: any) {
            logger.error('Get services error:', getErrorMessage(error));
            throw error;
        }
    },

    async updateService(id: string, updateData: Partial<IService>) {
        try {
            const service = await Service.findById(id);
            if (!service) {
                const error = new Error('Service not found');
                error.name = 'NotFoundError';
                throw error;
            }
            const oldImage = {
                url: service.img,
                publicId: service.imgPublicId,
                storage: service.imgStorage,
            };
            const previousStock = service.stock;
            const imageChanged = updateData.img !== undefined && updateData.img !== service.img;
            Object.keys(updateData).forEach((key) => {
                const value = (updateData as any)[key];
                if (value !== undefined) {
                    (service as any)[key] = value;
                }
            });
            const validationError = service.validateSync();
            if (validationError) throw validationError;
            await service.save();
            if (imageChanged) {
                await deleteStoredImage(oldImage);
                const promotedImage = await promotePendingUpload({
                    publicId: service.imgPublicId,
                    storage: service.imgStorage,
                    serviceId: service._id,
                });
                if (promotedImage) {
                    service.img = promotedImage.url;
                    service.imgPublicId = promotedImage.publicId;
                    service.imgStorage = promotedImage.storage as any;
                    service.images = [promotedImage.url];
                    await service.save();
                }
            }
            if (previousStock <= 0 && service.stock > 0) {
                await notifyBackInStock(service._id.toString(), service.name);
            }
            return service;
        } catch (error: any) {
            logger.error('Update service error:', getErrorMessage(error));
            throw error;
        }
    },

    async deleteService(id: string) {
        try {
            const service = await Service.findByIdAndDelete(id);
            if (!service) throw new Error('Service not found');
            await deleteStoredImage({
                url: service.img,
                publicId: service.imgPublicId,
                storage: service.imgStorage,
            });
            return service;
        } catch (error: any) {
            logger.error('Delete service error:', getErrorMessage(error));
            throw error;
        }
    },

    async getAllCategories() {
        try {
            const categories = await Service.distinct('category');
            return categories;
        } catch (error: any) {
            logger.error('Get categories error:', getErrorMessage(error));
            throw error;
        }
    },

    async getServiceStatistics() {
        try {
            const [totalServices, categories, avgPriceAgg] = await Promise.all([
                Service.countDocuments(),
                Service.distinct('category'),
                Service.aggregate([{ $group: { _id: null, avgPrice: { $avg: '$price' } } }]),
            ]);
            const averagePrice = avgPriceAgg[0] ? avgPriceAgg[0].avgPrice : 0;
            return {
                totalServices,
                categories,
                averagePrice,
            };
        } catch (error: any) {
            logger.error('Get service statistics error:', getErrorMessage(error));
            throw error;
        }
    },
};

export default serviceService;
