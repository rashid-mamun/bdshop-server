import StockNotification from '../models/stockNotification';
import environment from '../config/environment';
import { logger } from '../utils/logger';
import { sendEmail } from './emailService';

export const notifyBackInStock = async (serviceId: string, productName: string) => {
    const notifications = await StockNotification.find({ serviceId, status: 'pending' });
    if (notifications.length === 0) return 0;

    await Promise.all(
        notifications.map(async (notification) => {
            await sendEmail({
                to: notification.email,
                subject: `${productName} is back in stock`,
                text: `${productName} is available again. View it here: ${environment.FRONTEND_URL}/products/${serviceId}`,
            });
            notification.status = 'notified';
            await notification.save();
        }),
    );

    logger.info(`Back-in-stock notifications sent for service ${serviceId}`, {
        count: notifications.length,
    });
    return notifications.length;
};
