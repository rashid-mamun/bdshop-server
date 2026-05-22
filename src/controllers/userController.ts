import { Request, Response } from 'express';
import userService from '../services/userService';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response';
import { STATUS_CODES } from '../constants/statusCodes';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants/messages';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { IUser } from '../types';
import { User } from '../models/user';
import { USER_ROLES } from '../constants/config';

type RequestWithUser = Request & {
    user?: {
        id?: string;
        email?: string;
        role?: string;
    };
};

const isAdminRole = (role?: string) => role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN;

const userController = {
    createUser: asyncHandler(async (req: Request, res: Response) => {
        try {
            const user = await userService.createUser(req.body);
            logger.info(`User created: ${user.email}`);

            const { generateTokens, setAuthCookies } = await import('../utils/jwt');
            const tokens = generateTokens({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

            sendSuccessResponse(
                res,
                STATUS_CODES.CREATED,
                SUCCESS_MESSAGES.USER_CREATED,
                user.toPublicJSON(),
            );
        } catch (error: any) {
            if (getErrorCode(error) === 11000 && error.keyPattern && error.keyPattern.email) {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.BAD_REQUEST,
                    ERROR_MESSAGES.USER_ALREADY_EXISTS,
                );
            }
            logger.error('Create user error:', getErrorMessage(error));
            sendErrorResponse(
                res,
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                ERROR_MESSAGES.USER_CREATION_FAILED,
            );
        }
    }),

    login: asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return sendErrorResponse(
                res,
                STATUS_CODES.BAD_REQUEST,
                'Email and password are required',
            );
        }

        try {
            const user = await userService.verifyUserPassword(email, password);
            if (!user) {
                return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'Invalid credentials');
            }

            const { generateTokens, setAuthCookies } = await import('../utils/jwt');
            const tokens = generateTokens({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            });
            setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

            sendSuccessResponse(res, STATUS_CODES.OK, 'Login successful', user.toPublicJSON());
        } catch (error: any) {
            logger.error('Login error:', getErrorMessage(error));
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Login failed');
        }
    }),

    logout: asyncHandler(async (req: Request, res: Response) => {
        const { clearAuthCookies } = await import('../utils/jwt');
        clearAuthCookies(res);
        sendSuccessResponse(res, STATUS_CODES.OK, 'Logout successful');
    }),

    getUserByEmail: asyncHandler(async (req: Request, res: Response) => {
        try {
            const user = await userService.getUserByEmail(req.params.email as string);
            const isAdmin = user.role === 'admin';
            logger.info(`User fetched: ${user.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_FETCHED, {
                admin: isAdmin,
                user: user.toPublicJSON(),
            });
        } catch (error: any) {
            if (getErrorMessage(error) === 'User not found') {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.NOT_FOUND,
                    ERROR_MESSAGES.USER_NOT_FOUND,
                );
            }
            logger.error('Get user error:', getErrorMessage(error));
            sendErrorResponse(
                res,
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                ERROR_MESSAGES.USER_FETCH_FAILED,
            );
        }
    }),

    getAllUsers: asyncHandler(async (req: Request, res: Response) => {
        const { page, limit, role, isActive, division, district } = req.query as any;
        const filters: {
            role?: string;
            isActive?: boolean;
            division?: string;
            district?: string;
        } = {};

        if (role) filters.role = role;
        if (isActive !== undefined) filters.isActive = isActive === 'true';
        if (division) filters.division = division;
        if (district) filters.district = district;

        const result = await userService.getAllUsers(filters, { page, limit });
        logger.info(`Users fetched: ${result.users.length} users`);
        sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USERS_FETCHED, result);
    }),

    updateUser: asyncHandler(async (req: Request, res: Response) => {
        const requester = (req as RequestWithUser).user;
        const targetEmail = req.body.email as string;
        const requesterIsAdmin = isAdminRole(requester?.role);

        if (!requesterIsAdmin && requester?.email !== targetEmail) {
            return sendErrorResponse(
                res,
                STATUS_CODES.FORBIDDEN,
                ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS,
            );
        }

        const { email: _email, password: _password, ...updateData } = req.body;
        if (!requesterIsAdmin) {
            delete updateData.role;
            delete updateData.isActive;
            delete updateData.googleId;
            delete updateData.facebookId;
            delete updateData.lastLogin;
        }

        const user = await userService.updateUser(targetEmail, updateData);
        logger.info(`User updated: ${user.email}`);
        sendSuccessResponse(
            res,
            STATUS_CODES.OK,
            SUCCESS_MESSAGES.USER_UPDATED,
            user.toPublicJSON(),
        );
    }),

    deleteUser: asyncHandler(async (req: Request, res: Response) => {
        try {
            await userService.deleteUser(req.params.email as string);
            logger.info(`User deleted: ${req.params.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, SUCCESS_MESSAGES.USER_DELETED);
        } catch (error: any) {
            if (getErrorMessage(error) === 'User not found') {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.NOT_FOUND,
                    ERROR_MESSAGES.USER_NOT_FOUND,
                );
            }
            logger.error('Delete user error:', getErrorMessage(error));
            sendErrorResponse(
                res,
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                ERROR_MESSAGES.USER_DELETION_FAILED,
            );
        }
    }),

    makeUserAdmin: asyncHandler(async (req: Request, res: Response) => {
        const user = await userService.makeUserAdmin(req.body.email as string);
        logger.info(`User role updated to admin: ${user.email}`);
        sendSuccessResponse(
            res,
            STATUS_CODES.OK,
            SUCCESS_MESSAGES.USER_ADMIN_UPDATED,
            user.toPublicJSON(),
        );
    }),

    getProfile: asyncHandler(async (req: Request, res: Response) => {
        const user = await userService.getUserByEmail((req as any).user.email as string);
        sendSuccessResponse(
            res,
            STATUS_CODES.OK,
            SUCCESS_MESSAGES.USER_FETCHED,
            user.toPublicJSON(),
        );
    }),

    updateProfile: asyncHandler(async (req: Request, res: Response) => {
        try {
            const user = await userService.updateUser((req as any).user.email as string, req.body, {
                runValidators: true,
            });
            logger.info(`Profile updated: ${user.email}`);
            sendSuccessResponse(
                res,
                STATUS_CODES.OK,
                SUCCESS_MESSAGES.USER_UPDATED,
                user.toPublicJSON(),
            );
        } catch (error: any) {
            if (getErrorName(error) === 'ValidationError') {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.BAD_REQUEST,
                    ERROR_MESSAGES.VALIDATION_ERROR,
                );
            }
            logger.error('Update profile error:', getErrorMessage(error));
            sendErrorResponse(
                res,
                STATUS_CODES.INTERNAL_SERVER_ERROR,
                ERROR_MESSAGES.USER_UPDATE_FAILED,
            );
        }
    }),

    deactivateUser: asyncHandler(async (req: Request, res: Response) => {
        try {
            const user = await userService.deactivateUser(req.params.email as string);
            logger.info(`User deactivated: ${user.email}`);
            sendSuccessResponse(
                res,
                STATUS_CODES.OK,
                'User deactivated successfully',
                user.toPublicJSON(),
            );
        } catch (error: any) {
            if (getErrorMessage(error) === 'User not found') {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.NOT_FOUND,
                    ERROR_MESSAGES.USER_NOT_FOUND,
                );
            }
            logger.error('Deactivate user error:', getErrorMessage(error));
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'User deactivation failed');
        }
    }),

    reactivateUser: asyncHandler(async (req: Request, res: Response) => {
        try {
            const user = await userService.reactivateUser(req.params.email as string);
            logger.info(`User reactivated: ${user.email}`);
            sendSuccessResponse(
                res,
                STATUS_CODES.OK,
                'User reactivated successfully',
                user.toPublicJSON(),
            );
        } catch (error: any) {
            if (getErrorMessage(error) === 'User not found') {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.NOT_FOUND,
                    ERROR_MESSAGES.USER_NOT_FOUND,
                );
            }
            logger.error('Reactivate user error:', getErrorMessage(error));
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'User reactivation failed');
        }
    }),
    refreshToken: asyncHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'Refresh token missing');
        }

        try {
            const jwt = await import('jsonwebtoken');
            const environment = (await import('../config/environment')).default;
            const payload = jwt.verify(
                refreshToken,
                environment.JWT_REFRESH_SECRET as string,
            ) as any;

            const user = await User.findOne({ email: payload.email });
            if (!user?.isActive) {
                return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'User account is inactive');
            }

            const { generateTokens, setAuthCookies } = await import('../utils/jwt');
            const tokens = generateTokens({
                id: user._id.toString(),
                email: user.email,
                role: user.role,
            });

            setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
            sendSuccessResponse(res, STATUS_CODES.OK, 'Token refreshed successfully');
        } catch (error) {
            logger.error('Refresh token error:', error);
            sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'Invalid refresh token');
        }
    }),
    changePassword: asyncHandler(async (req: Request, res: Response) => {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return sendErrorResponse(
                res,
                STATUS_CODES.BAD_REQUEST,
                'Both current and new passwords are required',
            );
        }
        if (newPassword.length < 6) {
            return sendErrorResponse(
                res,
                STATUS_CODES.BAD_REQUEST,
                'New password must be at least 6 characters',
            );
        }
        try {
            const bcrypt = await import('bcryptjs');
            const user = await User.findOne({ email: (req as any).user.email as string }).select(
                '+password',
            );
            if (!user) return sendErrorResponse(res, STATUS_CODES.NOT_FOUND, 'User not found');
            if (!user.password) {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.BAD_REQUEST,
                    'Cannot change password for social login accounts',
                );
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.BAD_REQUEST,
                    'Current password is incorrect',
                );
            }
            const isSame = await bcrypt.compare(newPassword, user.password);
            if (isSame) {
                return sendErrorResponse(
                    res,
                    STATUS_CODES.BAD_REQUEST,
                    'New password cannot be the same as current password',
                );
            }
            user.password = newPassword;
            await user.save();
            logger.info(`Password changed: ${user.email}`);
            sendSuccessResponse(res, STATUS_CODES.OK, 'Password changed successfully');
        } catch (error: any) {
            logger.error('Change password error:', getErrorMessage(error));
            sendErrorResponse(res, STATUS_CODES.INTERNAL_SERVER_ERROR, 'Password change failed');
        }
    }),
};

export default userController;
