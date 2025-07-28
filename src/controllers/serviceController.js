const serviceService = require('../services/serviceService');
const { createSuccessResponse } = require('../utils/response');

// Simple service controller - clean functional code
const serviceController = {
    // Create service
    createService: async (req, res) => {
        try {
            const service = await serviceService.createService(req.body);
            res.status(201).json(createSuccessResponse(service, 'Service created successfully'));
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    // Get service by ID
    getServiceById: async (req, res) => {
        try {
            const service = await serviceService.getServiceById(req.params.id);
            res.json(createSuccessResponse(service, 'Service fetched successfully'));
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(400).json({ success: false, error: 'Invalid service ID format' });
            }
            res.status(404).json({ success: false, error: error.message });
        }
    },

    // Get all services
    getAllServices: async (req, res) => {
        try {
            const { page, limit, category, minPrice, maxPrice, search } = req.query;
            const filters = { category, minPrice, maxPrice, search };
            const pagination = { page, limit };

            const result = await serviceService.getAllServices(filters, pagination);
            res.json({
                success: true,
                message: 'Services fetched successfully',
                data: {
                    services: result.services,
                    pagination: result.pagination
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Update service
    updateService: async (req, res) => {
        try {
            const service = await serviceService.updateService(req.params.id, req.body);
            if (!service) {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }
            res.json(createSuccessResponse(service, 'Service updated successfully'));
        } catch (error) {
            if (error.name === 'NotFoundError') {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }
            if (error.name === 'ValidationError') {
                return res.status(400).json({ success: false, error: error.message });
            }
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Delete service
    deleteService: async (req, res) => {
        try {
            await serviceService.deleteService(req.params.id);
            res.json(createSuccessResponse(null, 'Service deleted successfully'));
        } catch (error) {
            if (error.name === 'CastError') {
                return res.status(400).json({ success: false, error: 'Invalid service ID format' });
            }
            if (error.message === 'Service not found') {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }
            res.status(400).json({ success: false, error: error.message });
        }
    },

    // Get all categories
    getAllCategories: async (req, res) => {
        try {
            const categories = await serviceService.getAllCategories();
            res.json(createSuccessResponse(categories));
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Search services
    searchServices: async (req, res) => {
        try {
            const { q, category, minPrice, maxPrice, page, limit } = req.query;
            const filters = { search: q, category, minPrice, maxPrice };
            const pagination = { page, limit };
            const result = await serviceService.getAllServices(filters, pagination);
            res.json({
                success: true,
                message: 'Services fetched successfully',
                data: {
                    services: result.services,
                    pagination: result.pagination
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get service statistics
    getServiceStatistics: async (req, res) => {
        try {
            const stats = await serviceService.getServiceStatistics();
            res.json(createSuccessResponse(stats));
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
};

module.exports = serviceController; 