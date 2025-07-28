const User = require('../models/user');
const { logger } = require('../utils/logger');

// Simple user service - clean functional code
const userService = {
    // Create user
    async createUser(userData) {
        try {
            const user = new User(userData);
            const savedUser = await user.save();
            logger.info('User created:', savedUser.email);
            return savedUser;
        } catch (error) {
            logger.error('Create user error:', error.message);
            throw error;
        }
    },

    // Get user by email
    async getUserByEmail(email) {
        try {
            const user = await User.findOne({ email });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            logger.error('Get user error:', error.message);
            throw error;
        }
    },

    // Get all users
    async getAllUsers(filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;
            const skip = (page - 1) * limit;
            const query = filters.role ? { role: filters.role } : {};

            const [users, total] = await Promise.all([
                User.find(query).skip(skip).limit(parseInt(limit)),
                User.countDocuments(query)
            ]);

            return {
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Get users error:', error.message);
            throw error;
        }
    },

    // Update user
    async updateUser(email, updateData, options = {}) {
        try {
            // Only update provided fields
            const updateFields = {};
            for (const key in updateData) {
                if (updateData[key] !== undefined) {
                    updateFields[key] = updateData[key];
                }
            }
            // Allow disabling validators for partial profile updates
            const runValidators = options.runValidators !== undefined ? options.runValidators : true;
            const user = await User.findOneAndUpdate({ email }, updateFields, { new: true, runValidators });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            logger.error('Update user error:', error.message);
            throw error;
        }
    },

    // Delete user
    async deleteUser(email) {
        try {
            const user = await User.findOneAndDelete({ email });
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            logger.error('Delete user error:', error.message);
            throw error;
        }
    },

    // Make user admin
    async makeUserAdmin(email) {
        try {
            const user = await User.findOneAndUpdate(
                { email },
                { role: 'admin' },
                { new: true }
            );
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            logger.error('Make admin error:', error.message);
            throw error;
        }
    },

    // Deactivate user
    async deactivateUser(email) {
        try {
            const user = await User.findOneAndUpdate(
                { email },
                { isActive: false },
                { new: true }
            );
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            logger.error('Deactivate user error:', error.message);
            throw error;
        }
    },

    // Reactivate user
    async reactivateUser(email) {
        try {
            const user = await User.findOneAndUpdate(
                { email },
                { isActive: true },
                { new: true }
            );
            if (!user) throw new Error('User not found');
            return user;
        } catch (error) {
            logger.error('Reactivate user error:', error.message);
            throw error;
        }
    }
};

module.exports = userService; 