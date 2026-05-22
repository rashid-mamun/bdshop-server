import { Request, Response } from 'express';
import StockNotification from '../models/stockNotification';
import Service from '../models/services';
import { createSuccessResponse } from '../utils/response';
import { getErrorMessage } from '../utils/errorHandler';
import { validateEmail } from '../middleware/validation';

export const createStockNotification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const serviceId = req.params.id;

        if (!email || !validateEmail(email)) {
            return res.status(400).json({ success: false, error: 'Valid email is required' });
        }

        const service = await Service.findById(serviceId);
        if (!service) {
            return res.status(404).json({ success: false, error: 'Service not found' });
        }

        // Prevent duplicate notifications
        const existing = await StockNotification.findOne({ email, serviceId, status: 'pending' });
        if (existing) {
            return res.json(createSuccessResponse(existing, 'Notification already saved'));
        }

        const notification = new StockNotification({
            email,
            serviceId,
        });

        await notification.save();

        res.status(201).json(createSuccessResponse(notification, 'Back-in-stock alert saved successfully'));
    } catch (error: Error | unknown) {
        res.status(500).json({ success: false, error: getErrorMessage(error) });
    }
};
