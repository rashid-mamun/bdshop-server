import { Document } from 'mongoose';

export interface IUser extends Document {
    email: string;
    displayName: string;
    password?: string;
    phone?: string;
    googleId?: string;
    facebookId?: string;
    district?: string;
    division?: string;
    role: string;
    isActive: boolean;
    lastLogin?: Date;
    profileImage?: string;
    dob?: string;
    gender?: string;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    fullName: string;
    status: string;
    toPublicJSON(): Partial<IUser>;
    isAdmin(): boolean;
}
