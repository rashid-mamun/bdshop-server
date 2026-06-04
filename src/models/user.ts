import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';
import { USER_ROLES } from '../constants/config';

export type { IUser } from '../types';

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            select: false,
        },
        phone: {
            type: String,
            trim: true,
        },
        googleId: {
            type: String,
        },
        facebookId: {
            type: String,
        },
        district: {
            type: String,
            trim: true,
        },
        division: {
            type: String,
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(USER_ROLES),
            default: USER_ROLES.USER,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
        profileImage: {
            type: String,
            default: null,
        },
        dob: {
            type: String,
        },
        gender: {
            type: String,
        },
        passwordResetToken: {
            type: String,
            select: false,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

userSchema.virtual('fullName').get(function (this: IUser) {
    return this.displayName;
});

userSchema.virtual('status').get(function (this: IUser) {
    return this.isActive ? 'active' : 'inactive';
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const bcrypt = await import('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password as string, salt);
        next();
    } catch (error: any) {
        next(error);
    }
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

userSchema.methods.toPublicJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    delete user.__v;
    return user;
};

userSchema.methods.isAdmin = function () {
    return this.role === USER_ROLES.ADMIN || this.role === USER_ROLES.SUPER_ADMIN;
};

export const User = mongoose.model<IUser>('User', userSchema);
export default User;
