const mongoose = require('mongoose');
const { USER_ROLES, APP_CONFIG } = require('../constants/config');
const { VALIDATION_MESSAGES } = require('../constants/messages');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, VALIDATION_MESSAGES.EMAIL_REQUIRED],
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: [APP_CONFIG.EMAIL_MAX_LENGTH, 'Email cannot exceed 254 characters'],
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    displayName: {
        type: String,
        required: [true, VALIDATION_MESSAGES.DISPLAY_NAME_REQUIRED],
        trim: true,
        minlength: [APP_CONFIG.DISPLAY_NAME_MIN_LENGTH, VALIDATION_MESSAGES.DISPLAY_NAME_MIN_LENGTH],
        maxlength: [APP_CONFIG.DISPLAY_NAME_MAX_LENGTH, 'Display name cannot exceed 50 characters']
    },
    password: {
        type: String,
        required: [true, VALIDATION_MESSAGES.PASSWORD_REQUIRED],
        minlength: [APP_CONFIG.PASSWORD_MIN_LENGTH, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH],
        maxlength: [APP_CONFIG.PASSWORD_MAX_LENGTH, 'Password cannot exceed 128 characters']
    },
    district: {
        type: String,
        required: [true, VALIDATION_MESSAGES.DISTRICT_REQUIRED],
        trim: true
    },
    division: {
        type: String,
        required: [true, VALIDATION_MESSAGES.DIVISION_REQUIRED],
        trim: true
    },
    role: {
        type: String,
        enum: {
            values: Object.values(USER_ROLES),
            message: VALIDATION_MESSAGES.ROLE_INVALID
        },
        default: USER_ROLES.USER
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    profileImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
    return this.displayName;
});

// Virtual for user status
userSchema.virtual('status').get(function () {
    return this.isActive ? 'active' : 'inactive';
});

// Indexes for better performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ division: 1, district: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password (if implemented)
userSchema.pre('save', function (next) {
    // Password hashing would go here
    // For now, just continue
    next();
});

// Instance methods
userSchema.methods.toPublicJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

userSchema.methods.isAdmin = function () {
    return this.role === USER_ROLES.ADMIN;
};

// Static methods
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function () {
    return this.find({ isActive: true });
};

userSchema.statics.findByRole = function (role) {
    return this.find({ role });
};

module.exports = mongoose.model('User', userSchema); 