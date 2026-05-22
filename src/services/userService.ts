import User from '../models/user';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';
import { IUser } from '../types';
import { logger } from '../utils/logger';
import { APP_CONFIG } from '../constants/config';
import bcrypt from 'bcryptjs';

type UserFilters = {
    role?: string;
    isActive?: boolean;
    division?: string;
    district?: string;
};

type PaginationOptions = {
    page?: string | number;
    limit?: string | number;
};

type UpdateOptions = {
    runValidators?: boolean;
};

const userService = {
    async createUser(userData: Partial<IUser>) {
        try {
            const user = new User(userData);
            const savedUser = await user.save();
            logger.info('User created:', savedUser.email);
            return savedUser;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Create user error:', errorMessage);
            throw error;
        }
    },

    async verifyUserPassword(email: string, passwordText: string) {
        try {
            const user = await User.findOne({ email }).select('+password');
            if (!user || !user.password || !user.isActive) return null;

            const isMatch = await bcrypt.compare(passwordText, user.password);
            if (!isMatch) return null;

            return user;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Error verifying user password:', errorMessage);
            throw error;
        }
    },

    async getUserByEmail(email: string) {
        try {
            const user = await User.findOne({ email });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Get user error:', errorMessage);
            throw error;
        }
    },

    async getAllUsers(filters: UserFilters = {}, pagination: PaginationOptions = {}) {
        try {
            const requestedPage = Number(pagination.page ?? 1);
            const requestedLimit = Number(pagination.limit ?? APP_CONFIG.DEFAULT_LIMIT);
            const currentPage = Math.max(1, Number.isFinite(requestedPage) ? requestedPage : 1);
            const pageSize = Math.min(
                APP_CONFIG.MAX_PAGE_SIZE,
                Math.max(
                    1,
                    Number.isFinite(requestedLimit) ? requestedLimit : APP_CONFIG.DEFAULT_LIMIT,
                ),
            );
            const skip = (currentPage - 1) * pageSize;
            const query: Record<string, unknown> = {};
            if (filters.role) query.role = filters.role;
            if (filters.isActive !== undefined) query.isActive = filters.isActive;
            if (filters.division) query.division = filters.division;
            if (filters.district) query.district = filters.district;

            const [users, total] = await Promise.all([
                User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
                User.countDocuments(query),
            ]);

            return {
                users,
                pagination: {
                    page: currentPage,
                    limit: pageSize,
                    total,
                    pages: Math.ceil(total / pageSize),
                },
            };
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Get users error:', errorMessage);
            throw error;
        }
    },

    async updateUser(email: string, updateData: Partial<IUser>, options: UpdateOptions = {}) {
        try {
            const updateFields: Record<string, unknown> = {};
            for (const key in updateData) {
                if (updateData[key as keyof IUser] !== undefined) {
                    updateFields[key] = updateData[key as keyof IUser];
                }
            }
            const runValidators =
                options.runValidators !== undefined ? options.runValidators : true;
            const user = await User.findOneAndUpdate({ email }, updateFields, {
                new: true,
                runValidators,
            });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Update user error:', errorMessage);
            throw error;
        }
    },

    async deleteUser(email: string) {
        try {
            const user = await User.findOneAndDelete({ email });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Delete user error:', errorMessage);
            throw error;
        }
    },

    async makeUserAdmin(email: string) {
        try {
            const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Make admin error:', errorMessage);
            throw error;
        }
    },

    async deactivateUser(email: string) {
        try {
            const user = await User.findOneAndUpdate({ email }, { isActive: false }, { new: true });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Deactivate user error:', errorMessage);
            throw error;
        }
    },

    async reactivateUser(email: string) {
        try {
            const user = await User.findOneAndUpdate({ email }, { isActive: true }, { new: true });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error: Error | unknown) {
            const errorMessage = error instanceof Error ? getErrorMessage(error) : String(error);
            logger.error('Reactivate user error:', errorMessage);
            throw error;
        }
    },
};

export default userService;
