import { Request, Response } from 'express';
import serviceService from '../services/serviceService';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { createSuccessResponse } from '../utils/response';

const serviceController = {
    createService: async (req: Request, res: Response) => {
        try {
            const service = await serviceService.createService(req.body);
            res.status(201).json(createSuccessResponse(service, 'Service created successfully'));
        } catch (error: Error | unknown) {
            res.status(400).json({ success: false, error: getErrorMessage(error) });
        }
    },

    getServiceById: async (req: Request, res: Response) => {
        try {
            const service = await serviceService.getServiceById(req.params.id as string);
            res.json(createSuccessResponse(service, 'Service fetched successfully'));
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'CastError') {
                return res.status(400).json({ success: false, error: 'Invalid service ID format' });
            }
            res.status(404).json({ success: false, error: getErrorMessage(error) });
        }
    },

    getAllServices: async (req: Request, res: Response) => {
        try {
            const {
                page,
                limit,
                category,
                minPrice,
                maxPrice,
                search,
                featured,
                flashDeal,
                newArrival,
                rating,
                sort,
                inStock,
            } = req.query as any;
            const filters = {
                category,
                minPrice,
                maxPrice,
                search,
                featured,
                flashDeal,
                newArrival,
                rating,
                inStock,
            };
            const options = { page, limit, sort };

            const result = await serviceService.getAllServices(filters, options);
            res.json({
                success: true,
                message: 'Services fetched successfully',
                data: {
                    services: result.services,
                    pagination: result.pagination,
                },
            });
        } catch (error: Error | unknown) {
            res.status(500).json({ success: false, error: getErrorMessage(error) });
        }
    },

    updateService: async (req: Request, res: Response) => {
        try {
            const service = await serviceService.updateService(req.params.id as string, req.body);
            if (!service) {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }
            res.json(createSuccessResponse(service, 'Service updated successfully'));
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'NotFoundError') {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }
            if (getErrorName(error) === 'ValidationError') {
                return res.status(400).json({ success: false, error: getErrorMessage(error) });
            }
            res.status(500).json({ success: false, error: getErrorMessage(error) });
        }
    },

    deleteService: async (req: Request, res: Response) => {
        try {
            await serviceService.deleteService(req.params.id as string);
            res.json(createSuccessResponse(null, 'Service deleted successfully'));
        } catch (error: Error | unknown) {
            if (getErrorName(error) === 'CastError') {
                return res.status(400).json({ success: false, error: 'Invalid service ID format' });
            }
            if (getErrorMessage(error) === 'Service not found') {
                return res.status(404).json({ success: false, error: 'Service not found' });
            }
            res.status(400).json({ success: false, error: getErrorMessage(error) });
        }
    },

    getAllCategories: async (req: Request, res: Response) => {
        try {
            const categories = await serviceService.getAllCategories();
            res.json(createSuccessResponse(categories));
        } catch (error: Error | unknown) {
            res.status(500).json({ success: false, error: getErrorMessage(error) });
        }
    },

    searchServices: async (req: Request, res: Response) => {
        try {
            const { q, category, minPrice, maxPrice, page, limit } = req.query as any;
            const filters = { search: q, category, minPrice, maxPrice };
            const pagination = { page, limit };
            const result = await serviceService.getAllServices(filters, pagination);
            res.json({
                success: true,
                message: 'Services fetched successfully',
                data: {
                    services: result.services,
                    pagination: result.pagination,
                },
            });
        } catch (error: Error | unknown) {
            res.status(500).json({ success: false, error: getErrorMessage(error) });
        }
    },

    getServiceStatistics: async (req: Request, res: Response) => {
        try {
            const stats = await serviceService.getServiceStatistics();
            res.json(createSuccessResponse(stats));
        } catch (error: Error | unknown) {
            res.status(500).json({ success: false, error: getErrorMessage(error) });
        }
    },
};

export default serviceController;
