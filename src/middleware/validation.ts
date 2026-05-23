import { Request, Response, NextFunction } from 'express';
import { sendErrorResponse } from '../utils/response';
import { STATUS_CODES } from '../constants/statusCodes';
import { VALIDATION_MESSAGES } from '../constants/messages';
import { APP_CONFIG } from '../constants/config';
import { logger } from '../utils/logger';

const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string) => {
    const phoneRegex = /^\+?[0-9][0-9\s-]{6,20}$/;
    return phoneRegex.test(phone);
};

const validateURL = (url: string) => {
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
};

const validateUser = (req: Request, res: Response, next: NextFunction) => {
    const { email, displayName, password, phone } = req.body;

    if (!email || !displayName || !password || !phone) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'Missing required fields');
    }

    if (!validateEmail(email)) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.EMAIL_INVALID);
    }

    if (!validatePhone(phone)) {
        return sendErrorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            'Please provide a valid phone number',
        );
    }

    if (
        displayName.length < APP_CONFIG.DISPLAY_NAME_MIN_LENGTH ||
        displayName.length > APP_CONFIG.DISPLAY_NAME_MAX_LENGTH
    ) {
        return sendErrorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            VALIDATION_MESSAGES.DISPLAY_NAME_MIN_LENGTH,
        );
    }

    if (
        password.length < APP_CONFIG.PASSWORD_MIN_LENGTH ||
        password.length > APP_CONFIG.PASSWORD_MAX_LENGTH
    ) {
        return sendErrorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
        );
    }

    next();
};

const validateUserUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { email, displayName } = req.body;

    if (!email) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.EMAIL_REQUIRED);
    }

    if (email && !validateEmail(email)) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.EMAIL_INVALID);
    }

    if (
        displayName &&
        (displayName.length < APP_CONFIG.DISPLAY_NAME_MIN_LENGTH ||
            displayName.length > APP_CONFIG.DISPLAY_NAME_MAX_LENGTH)
    ) {
        return sendErrorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            VALIDATION_MESSAGES.DISPLAY_NAME_MIN_LENGTH,
        );
    }

    next();
};

const validateProfileUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { displayName, district, division, profileImage, dob, gender } = req.body;

    if (
        displayName &&
        (displayName.length < APP_CONFIG.DISPLAY_NAME_MIN_LENGTH ||
            displayName.length > APP_CONFIG.DISPLAY_NAME_MAX_LENGTH)
    ) {
        return sendErrorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            VALIDATION_MESSAGES.DISPLAY_NAME_MIN_LENGTH,
        );
    }

    if (profileImage && !validateURL(profileImage)) {
        return sendErrorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            'Please provide a valid profile image URL',
        );
    }

    if (!displayName && !district && !division && !profileImage && !dob && !gender) {
        return sendErrorResponse(
            res,
            STATUS_CODES.BAD_REQUEST,
            'At least one field must be provided for profile update',
        );
    }

    next();
};

const validateService = (req: Request, res: Response, next: NextFunction) => {
    const { name, model, img, price, description, config, category, madeIn } = req.body;

    if (
        !name ||
        !model ||
        !img ||
        price === undefined ||
        !description ||
        !config ||
        !category ||
        !madeIn
    ) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided',
        });
    }

    if (name.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Service name must be at least 2 characters long',
        });
    }

    if (price < 0) {
        return res.status(400).json({
            success: false,
            error: 'Price cannot be negative',
        });
    }

    next();
};

const validateServiceUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { name, model, img, price, description, config, category, madeIn } = req.body;

    if (name && name.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Service name must be at least 2 characters long',
        });
    }

    if (price !== undefined && price < 0) {
        return res.status(400).json({
            success: false,
            error: 'Price cannot be negative',
        });
    }

    if (
        !name &&
        !model &&
        !img &&
        price === undefined &&
        !description &&
        !config &&
        !category &&
        !madeIn
    ) {
        return res.status(400).json({
            success: false,
            error: 'At least one field must be provided for update',
        });
    }

    next();
};

const validateReview = (req: Request, res: Response, next: NextFunction) => {
    const { name, email, title, img, star } = req.body;
    const requesterEmail = (req as any).user?.email as string | undefined;
    const finalEmail = requesterEmail || email;

    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address',
        });
    }

    if (email && requesterEmail && email !== requesterEmail) {
        return res.status(403).json({
            success: false,
            error: 'Email does not match authenticated user',
        });
    }

    if (!name || !finalEmail || !title || !img || !star) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided',
        });
    }

    if (!validateEmail(finalEmail)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address',
        });
    }

    if (title.length < 5 || title.length > 100) {
        return res.status(400).json({
            success: false,
            error: 'Title must be between 5 and 100 characters',
        });
    }

    if (![1, 2, 3, 4, 5].includes(star)) {
        return res.status(400).json({
            success: false,
            error: 'Star rating must be between 1 and 5',
        });
    }

    next();
};

const validateReviewUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { email, title, star, description } = req.body;

    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address',
        });
    }

    if (title && (title.length < 5 || title.length > 100)) {
        return res.status(400).json({
            success: false,
            error: 'Title must be between 5 and 100 characters',
        });
    }

    if (star && ![1, 2, 3, 4, 5].includes(star)) {
        return res.status(400).json({
            success: false,
            error: 'Star rating must be between 1 and 5',
        });
    }

    if (description && description.length > 1000) {
        return res.status(400).json({
            success: false,
            error: 'Description cannot exceed 1000 characters',
        });
    }

    next();
};

const validateOrder = (req: Request, res: Response, next: NextFunction) => {
    const { email, items, shippingAddress, paymentStatus, status } = req.body;
    const requesterEmail = (req as any).user?.email as string | undefined;
    const finalEmail = requesterEmail || email;

    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address',
        });
    }

    if (email && requesterEmail && email !== requesterEmail) {
        return res.status(403).json({
            success: false,
            error: 'Email does not match authenticated user',
        });
    }

    if (!finalEmail || !items || !shippingAddress) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided',
        });
    }

    if (!validateEmail(finalEmail)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address',
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Items must be a non-empty array',
        });
    }

    for (const item of items) {
        if (!item.serviceId || !item.quantity) {
            logger.info('Validation Failed - Missing Item Fields:', item);
            return res.status(400).json({
                success: false,
                error: 'Each item must have serviceId and quantity',
            });
        }
        if (item.quantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'Item quantity must be at least 1',
            });
        }
    }

    const { street, city, district, division, postalCode, country, phone } = shippingAddress;
    const finalCity = city || district;
    if (!street || !finalCity || !division || !postalCode || !country || !phone) {
        logger.info('Validation Failed - Missing Address Fields:', {
            street,
            finalCity,
            division,
            postalCode,
            country,
            phone,
        });
        return res.status(400).json({
            success: false,
            error: 'Shipping address must include street, district/city, division, postalCode, country, and phone',
        });
    }

    if (paymentStatus && !['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
        return res.status(400).json({
            success: false,
            error: 'Payment status must be one of: pending, paid, failed, refunded',
        });
    }

    if (
        status &&
        !['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(
            status,
        )
    ) {
        return res.status(400).json({
            success: false,
            error: 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled',
        });
    }

    next();
};

const validateOrderUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { paymentStatus, status } = req.body;

    if (paymentStatus && !['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
        return res.status(400).json({
            success: false,
            error: 'Payment status must be one of: pending, paid, failed, refunded',
        });
    }

    if (
        status &&
        !['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(
            status,
        )
    ) {
        return res.status(400).json({
            success: false,
            error: 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled',
        });
    }

    if (!paymentStatus && !status) {
        return res.status(400).json({
            success: false,
            error: 'At least one field (paymentStatus or status) must be provided for update',
        });
    }

    next();
};

const validateCart = (req: Request, res: Response, next: NextFunction) => {
    const { id, email, img, description, model, price } = req.body;
    const requesterEmail = (req as any).user?.email as string | undefined;
    const finalEmail = requesterEmail || email;

    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address',
        });
    }

    if (email && requesterEmail && email !== requesterEmail) {
        return res.status(403).json({
            success: false,
            error: 'Email does not match authenticated user',
        });
    }

    if (!id || !finalEmail || !img || !description || !model || price === undefined) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided',
        });
    }

    if (!validateEmail(finalEmail)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address',
        });
    }

    if (price < 0) {
        return res.status(400).json({
            success: false,
            error: 'Price cannot be negative',
        });
    }

    next();
};

const validateBlog = (req: Request, res: Response, next: NextFunction) => {
    const { title, img, date } = req.body;

    if (!title || !img || !date) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided',
        });
    }

    if (title.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Title must be at least 2 characters long',
        });
    }

    next();
};

const validateCartQuantityUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({
            success: false,
            error: 'Quantity must be at least 1',
        });
    }
    next();
};

const validateServiceQuery = (req: Request, res: Response, next: NextFunction) => {
    const { minPrice, maxPrice, page, limit, rating } = req.query;

    if (minPrice && isNaN(Number(minPrice))) {
        return res.status(400).json({ success: false, error: 'minPrice must be a valid number' });
    }
    if (maxPrice && isNaN(Number(maxPrice))) {
        return res.status(400).json({ success: false, error: 'maxPrice must be a valid number' });
    }
    if (page && isNaN(Number(page))) {
        return res.status(400).json({ success: false, error: 'page must be a valid number' });
    }
    if (limit && isNaN(Number(limit))) {
        return res.status(400).json({ success: false, error: 'limit must be a valid number' });
    }
    if (rating && isNaN(Number(rating))) {
        return res.status(400).json({ success: false, error: 'rating must be a valid number' });
    }
    if (page && Number(page) < 1) {
        return res.status(400).json({ success: false, error: 'page must be at least 1' });
    }
    if (limit && (Number(limit) < 1 || Number(limit) > APP_CONFIG.MAX_PAGE_SIZE)) {
        return res.status(400).json({
            success: false,
            error: `limit must be between 1 and ${APP_CONFIG.MAX_PAGE_SIZE}`,
        });
    }
    if (minPrice && Number(minPrice) < 0) {
        return res.status(400).json({ success: false, error: 'minPrice cannot be negative' });
    }
    if (maxPrice && Number(maxPrice) < 0) {
        return res.status(400).json({ success: false, error: 'maxPrice cannot be negative' });
    }

    next();
};

export {
    validateEmail,
    validatePhone,
    validateURL,
    validateUser,
    validateUserUpdate,
    validateProfileUpdate,
    validateService,
    validateServiceUpdate,
    validateReview,
    validateReviewUpdate,
    validateOrder,
    validateOrderUpdate,
    validateCart,
    validateBlog,
    validateCartQuantityUpdate,
    validateServiceQuery,
};
