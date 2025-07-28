const { sendErrorResponse } = require('../utils/response');
const { STATUS_CODES } = require('../constants/statusCodes');
const { VALIDATION_MESSAGES } = require('../constants/messages');
const { APP_CONFIG } = require('../constants/config');
const logger = require('../config/logger');

// Email validation
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Phone validation
const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone);
};

// URL validation
const validateURL = (url) => {
    const urlRegex = /^https?:\/\/.+/;
    return urlRegex.test(url);
};

// User validation middleware
const validateUser = (req, res, next) => {
    const { email, displayName, password, district, division } = req.body;

    // Check required fields
    if (!email || !displayName || !password || !district || !division) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.MISSING_REQUIRED_FIELDS);
    }

    // Validate email
    if (!validateEmail(email)) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.EMAIL_INVALID);
    }

    // Validate display name
    if (displayName.length < APP_CONFIG.DISPLAY_NAME_MIN_LENGTH || displayName.length > APP_CONFIG.DISPLAY_NAME_MAX_LENGTH) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.DISPLAY_NAME_MIN_LENGTH);
    }

    // Validate password
    if (password.length < APP_CONFIG.PASSWORD_MIN_LENGTH || password.length > APP_CONFIG.PASSWORD_MAX_LENGTH) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH);
    }

    next();
};

// User update validation middleware
const validateUserUpdate = (req, res, next) => {
    const { email, displayName, district, division } = req.body;

    // Email is required for updates
    if (!email) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.EMAIL_REQUIRED);
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.EMAIL_INVALID);
    }

    // Validate display name if provided
    if (displayName && (displayName.length < APP_CONFIG.DISPLAY_NAME_MIN_LENGTH || displayName.length > APP_CONFIG.DISPLAY_NAME_MAX_LENGTH)) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.DISPLAY_NAME_MIN_LENGTH);
    }

    next();
};

// Profile update validation middleware (for profile updates - email not required)
const validateProfileUpdate = (req, res, next) => {
    const { displayName, district, division } = req.body;

    // Validate display name if provided
    if (displayName && (displayName.length < APP_CONFIG.DISPLAY_NAME_MIN_LENGTH || displayName.length > APP_CONFIG.DISPLAY_NAME_MAX_LENGTH)) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, VALIDATION_MESSAGES.DISPLAY_NAME_MIN_LENGTH);
    }

    // At least one field must be provided for update
    if (!displayName && !district && !division) {
        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'At least one field must be provided for profile update');
    }

    next();
};

// Service validation middleware
const validateService = (req, res, next) => {
    const { name, model, img, price, description, config, category, madeIn } = req.body;

    if (!name || !model || !img || !price || !description || !config || !category || !madeIn) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided'
        });
    }

    if (name.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Service name must be at least 2 characters long'
        });
    }

    if (price < 0) {
        return res.status(400).json({
            success: false,
            error: 'Price cannot be negative'
        });
    }

    next();
};

// Service update validation middleware (for partial updates)
const validateServiceUpdate = (req, res, next) => {
    const { name, model, img, price, description, config, category, madeIn } = req.body;

    // Validate name if provided
    if (name && name.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Service name must be at least 2 characters long'
        });
    }

    // Validate price if provided
    if (price !== undefined && price < 0) {
        return res.status(400).json({
            success: false,
            error: 'Price cannot be negative'
        });
    }

    // At least one field must be provided for update
    if (!name && !model && !img && price === undefined && !description && !config && !category && !madeIn) {
        return res.status(400).json({
            success: false,
            error: 'At least one field must be provided for update'
        });
    }

    next();
};

// Review validation middleware
const validateReview = (req, res, next) => {
    const { name, email, title, img, star } = req.body;

    if (!name || !email || !title || !img || !star) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided'
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address'
        });
    }

    if (title.length < 5 || title.length > 100) {
        return res.status(400).json({
            success: false,
            error: 'Title must be between 5 and 100 characters'
        });
    }

    if (![1, 2, 3, 4, 5].includes(star)) {
        return res.status(400).json({
            success: false,
            error: 'Star rating must be between 1 and 5'
        });
    }

    next();
};

// Review update validation middleware
const validateReviewUpdate = (req, res, next) => {
    const { name, email, title, img, star, description } = req.body;

    // Validate email if provided
    if (email && !validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address'
        });
    }

    // Validate title if provided
    if (title && (title.length < 5 || title.length > 100)) {
        return res.status(400).json({
            success: false,
            error: 'Title must be between 5 and 100 characters'
        });
    }

    // Validate star rating if provided
    if (star && ![1, 2, 3, 4, 5].includes(star)) {
        return res.status(400).json({
            success: false,
            error: 'Star rating must be between 1 and 5'
        });
    }

    // Validate description length if provided
    if (description && description.length > 1000) {
        return res.status(400).json({
            success: false,
            error: 'Description cannot exceed 1000 characters'
        });
    }

    next();
};

// Order validation middleware
const validateOrder = (req, res, next) => {
    const { email, items, total, shippingAddress, paymentStatus, status } = req.body;

    if (!email || !items || !total || !shippingAddress) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided'
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address'
        });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Items must be a non-empty array'
        });
    }

    // Validate each item in the array
    for (const item of items) {
        if (!item.serviceId || !item.name || !item.price || !item.quantity) {
            return res.status(400).json({
                success: false,
                error: 'Each item must have serviceId, name, price, and quantity'
            });
        }
        if (item.price < 0) {
            return res.status(400).json({
                success: false,
                error: 'Item price cannot be negative'
            });
        }
        if (item.quantity < 1) {
            return res.status(400).json({
                success: false,
                error: 'Item quantity must be at least 1'
            });
        }
    }

    // Validate total
    if (total < 0) {
        return res.status(400).json({
            success: false,
            error: 'Total cannot be negative'
        });
    }

    // Validate shipping address
    const { street, city, postalCode, country } = shippingAddress;
    if (!street || !city || !postalCode || !country) {
        return res.status(400).json({
            success: false,
            error: 'Shipping address must include street, city, postalCode, and country'
        });
    }

    // Validate payment status if provided
    if (paymentStatus && !['pending', 'paid', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({
            success: false,
            error: 'Payment status must be one of: pending, paid, failed'
        });
    }

    // Validate status if provided
    if (status && !['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled'
        });
    }

    next();
};

// Order update validation middleware (for partial updates)
const validateOrderUpdate = (req, res, next) => {
    const { paymentStatus, status } = req.body;

    // Validate payment status if provided
    if (paymentStatus && !['pending', 'paid', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({
            success: false,
            error: 'Payment status must be one of: pending, paid, failed'
        });
    }

    // Validate status if provided
    if (status && !['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled'
        });
    }

    // At least one field must be provided for update
    if (!paymentStatus && !status) {
        return res.status(400).json({
            success: false,
            error: 'At least one field (paymentStatus or status) must be provided for update'
        });
    }

    next();
};

// Cart validation middleware
const validateCart = (req, res, next) => {
    const { id, email, img, description, model, price } = req.body;

    if (!id || !email || !img || !description || !model || !price) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided'
        });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({
            success: false,
            error: 'Please provide a valid email address'
        });
    }

    if (price < 0) {
        return res.status(400).json({
            success: false,
            error: 'Price cannot be negative'
        });
    }

    next();
};

// Blog validation middleware
const validateBlog = (req, res, next) => {
    const { title, img, date } = req.body;

    if (!title || !img || !date) {
        return res.status(400).json({
            success: false,
            error: 'All required fields must be provided'
        });
    }

    if (title.length < 2) {
        return res.status(400).json({
            success: false,
            error: 'Title must be at least 2 characters long'
        });
    }

    next();
};

// Cart quantity update validation middleware
const validateCartQuantityUpdate = (req, res, next) => {
    const { quantity } = req.body;
    if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({
            success: false,
            error: 'Quantity must be at least 1'
        });
    }
    next();
};

module.exports = {
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
    validateCartQuantityUpdate
}; 