const Service = require('../models/services');
const { logger } = require('../utils/logger');

// Simple service service - clean functional code
const serviceService = {
    // Create service
    async createService(serviceData) {
        try {
            const service = new Service(serviceData);
            const savedService = await service.save();
            logger.info('Service created:', savedService._id);
            return savedService;
        } catch (error) {
            logger.error('Create service error:', error.message);
            throw error;
        }
    },

    // Get service by ID
    async getServiceById(id) {
        try {
            const service = await Service.findById(id);
            if (!service) throw new Error('Service not found');
            return service;
        } catch (error) {
            logger.error('Get service error:', error.message);
            throw error;
        }
    },

    // Get all services
    async getAllServices(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const skip = (page - 1) * limit;

            let query = {};
            if (filters.category) query.category = filters.category;
            if (filters.search) query.$text = { $search: filters.search };
            if (filters.minPrice || filters.maxPrice) {
                query.price = {};
                if (filters.minPrice) query.price.$gte = parseFloat(filters.minPrice);
                if (filters.maxPrice) query.price.$lte = parseFloat(filters.maxPrice);
            }

            const [services, total] = await Promise.all([
                Service.find(query).skip(skip).limit(parseInt(limit)),
                Service.countDocuments(query)
            ]);

            return {
                services,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Get services error:', error.message);
            throw error;
        }
    },

    // Update service
    async updateService(id, updateData) {
        try {
            const service = await Service.findById(id);
            if (!service) {
                const error = new Error('Service not found');
                error.name = 'NotFoundError';
                throw error;
            }
            // Only update fields that are present and not undefined
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    service[key] = updateData[key];
                }
            });
            // Validate before save
            const validationError = service.validateSync();
            if (validationError) throw validationError;
            await service.save();
            return service;
        } catch (error) {
            logger.error('Update service error:', error.message);
            throw error;
        }
    },

    // Delete service
    async deleteService(id) {
        try {
            const service = await Service.findByIdAndDelete(id);
            if (!service) throw new Error('Service not found');
            return service;
        } catch (error) {
            logger.error('Delete service error:', error.message);
            throw error;
        }
    },

    // Get all categories
    async getAllCategories() {
        try {
            const categories = await Service.distinct('category');
            return categories;
        } catch (error) {
            logger.error('Get categories error:', error.message);
            throw error;
        }
    },

    // Get service statistics
    async getServiceStatistics() {
        try {
            const [totalServices, categories, avgPriceAgg] = await Promise.all([
                Service.countDocuments(),
                Service.distinct('category'),
                Service.aggregate([
                    { $group: { _id: null, avgPrice: { $avg: "$price" } } }
                ])
            ]);
            const averagePrice = avgPriceAgg[0] ? avgPriceAgg[0].avgPrice : 0;
            return {
                totalServices,
                categories,
                averagePrice
            };
        } catch (error) {
            logger.error('Get service statistics error:', error.message);
            throw error;
        }
    }
};

module.exports = serviceService; 