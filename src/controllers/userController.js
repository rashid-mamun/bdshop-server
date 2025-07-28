const userService = require('../services/userService');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { STATUS_CODES } = require('../constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../constants/messages');
const { asyncHandler } = require('../utils/asyncHandler');
const logger = require('../config/logger');

// User controller with improved error handling and logging
const userController = {
    // Create user
    createUser: asyncHandler(async (req, res) => {
        try {
            const user = await userService.createUser(req.body);
            logger.info(`User created: ${user.email}`);
            sendSuccessResponse(res, STATUS_CODES.CREATED, SUCCESS_MESSAGES.USER_CREATED, user.toPublicJSON());
        } catch (error) {
            // Duplicate email
            if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
                return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.USER_ALREADY_EXISTS);
            }
            // Mongoose validation error for email
            if (error.name === 'ValidationError') {
                if (error.errors && error.errors.email) {
                    // Accept both the default and custom error messages
                    const msg = error.errors.email.message;
                    if (
                        msg === 'Please provide a valid email address' ||
                        msg === ERROR_MESSAGES.EMAIL_INVALID ||
                        msg === VALIDATION_MESSAGES.EMAIL_INVALID
                    ) {
                        return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.EMAIL_INVALID);
                    }
                }
                // If the error message is 'Please provide a valid email address' or 'Invalid email format', map to EMAIL_INVALID
                if (error.message && (error.message.includes('valid email') || error.message.includes('Invalid email format'))) {
                    return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.EMAIL_INVALID);
                }
                return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.VALIDATION_ERROR);
            }
            logger.error('Create user error:', error.message);
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.USER_CREATION_FAILED);
        }
    }),

    // Get user by email
    getUserByEmail: asyncHandler(async (req, res) => {
        try {
            const user = await userService.getUserByEmail(req.params.email);
            const isAdmin = user.role === 'admin';
            logger.info(`User fetched: ${user.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_FETCHED, {
                admin: isAdmin,
                user: user.toPublicJSON()
            });
        } catch (error) {
            if (error.message === 'User not found') {
                return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
            }
            logger.error('Get user error:', error.message);
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.USER_FETCH_FAILED);
        }
    }),

    // Get all users with pagination and filtering
    getAllUsers: asyncHandler(async (req, res) => {
        const { page, limit, role, isActive, division, district } = req.query;
        const filters = {};

        if (role) filters.role = role;
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        if (division) filters.division = division;
        if (district) filters.district = district;

        const result = await userService.getAllUsers(filters, { page, limit });
        logger.info(`Users fetched: ${result.users.length} users`);
        sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USERS_FETCHED, result);
    }),

    // Update user
    updateUser: asyncHandler(async (req, res) => {
        const user = await userService.updateUser(req.body.email, req.body);
        logger.info(`User updated: ${user.email}`);
        sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_UPDATED, user.toPublicJSON());
    }),

    // Delete user
    deleteUser: asyncHandler(async (req, res) => {
        try {
            await userService.deleteUser(req.params.email);
            logger.info(`User deleted: ${req.params.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_DELETED);
        } catch (error) {
            if (error.message === 'User not found') {
                return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
            }
            logger.error('Delete user error:', error.message);
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.USER_DELETION_FAILED);
        }
    }),

    // Make user admin
    makeUserAdmin: asyncHandler(async (req, res) => {
        const user = await userService.makeUserAdmin(req.body.email);
        logger.info(`User role updated to admin: ${user.email}`);
        sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_ADMIN_UPDATED, user.toPublicJSON());
    }),

    // Get user profile
    getProfile: asyncHandler(async (req, res) => {
        const user = await userService.getUserByEmail(req.user.email);
        sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_FETCHED, user.toPublicJSON());
    }),

    // Update user profile
    updateProfile: asyncHandler(async (req, res) => {
        try {
            const user = await userService.updateUser(req.user.email, req.body, { runValidators: false });
            logger.info(`Profile updated: ${user.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_UPDATED, user.toPublicJSON());
        } catch (error) {
            if (error.name === 'ValidationError') {
                return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, ERROR_MESSAGES.VALIDATION_ERROR);
            }
            logger.error('Update profile error:', error.message);
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.USER_UPDATE_FAILED);
        }
    }),

    // Deactivate user
    deactivateUser: asyncHandler(async (req, res) => {
        try {
            const user = await userService.deactivateUser(req.params.email);
            logger.info(`User deactivated: ${user.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, 'User deactivated successfully', user.toPublicJSON());
        } catch (error) {
            if (error.message === 'User not found') {
                return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
            }
            logger.error('Deactivate user error:', error.message);
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'User deactivation failed');
        }
    }),

    // Reactivate user
    reactivateUser: asyncHandler(async (req, res) => {
        try {
            const user = await userService.reactivateUser(req.params.email);
            logger.info(`User reactivated: ${user.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, 'User reactivated successfully', user.toPublicJSON());
        } catch (error) {
            if (error.message === 'User not found') {
                return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
            }
            logger.error('Reactivate user error:', error.message);
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'User reactivation failed');
        }
    })
};

module.exports = userController; 