import { Request, Response } from 'express';
import User from '../models/user';
import { generateTokens, setAuthCookies } from '../utils/jwt';
import { sendSuccessResponse, sendErrorResponse } from '../utils/response';
import { STATUS_CODES } from '../constants/statusCodes';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { USER_ROLES } from '../constants/config';

export const authController = {
    googleLogin: asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.body;
        if (!token) return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'No token provided');

        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            logger.error('Google OAuth failed');
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'Invalid Google token');
        }

        const data = await response.json();
        const { sub: googleId, name, email, picture, email_verified: emailVerified } = data;

        if (!email || emailVerified === false) {
            return sendErrorResponse(
                res,
                STATUS_CODES.UNAUTHORIZED,
                'Google email is not verified',
            );
        }

        let user = await User.findOne({ email });
        if (user && !user.isActive) {
            return sendErrorResponse(res, STATUS_CODES.FORBIDDEN, 'User account is inactive');
        }
        if (!user) {
            user = await User.create({
                email,
                displayName: name,
                googleId,
                profileImage: picture,
                role: USER_ROLES.USER,
                isActive: true,
                lastLogin: new Date(),
            });
            logger.info(`New OAuth user created via Google: ${email}`);
        } else {
            if (!user.googleId) {
                user.googleId = googleId;
            }
            user.lastLogin = new Date();
            await user.save();
        }

        const tokens = generateTokens({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        sendSuccessResponse(res, STATUS_CODES.OK, 'Login successful', {
            user: user.toPublicJSON(),
            token: tokens.accessToken,
        });
    }),

    facebookLogin: asyncHandler(async (req: Request, res: Response) => {
        const { accessToken, userID } = req.body;
        if (!accessToken || !userID)
            return sendErrorResponse(res, STATUS_CODES.BAD_REQUEST, 'Invalid request');

        const response = await fetch(
            `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${accessToken}`,
        );

        if (!response.ok) {
            logger.error('Facebook OAuth failed');
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'Invalid Facebook token');
        }

        const data = await response.json();
        const { id: facebookId, name, email, picture } = data;

        if (facebookId !== userID) {
            return sendErrorResponse(res, STATUS_CODES.UNAUTHORIZED, 'Facebook user mismatch');
        }

        const userEmail = email || `${facebookId}@facebook.bdshop.com`;

        let user = await User.findOne({ email: userEmail });
        if (user && !user.isActive) {
            return sendErrorResponse(res, STATUS_CODES.FORBIDDEN, 'User account is inactive');
        }
        if (!user) {
            user = await User.create({
                email: userEmail,
                displayName: name,
                facebookId,
                profileImage: picture?.data?.url,
                role: USER_ROLES.USER,
                isActive: true,
                lastLogin: new Date(),
            });
            logger.info(`New OAuth user created via Facebook: ${userEmail}`);
        } else {
            if (!user.facebookId) {
                user.facebookId = facebookId;
            }
            user.lastLogin = new Date();
            await user.save();
        }

        const tokens = generateTokens({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });
        setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

        sendSuccessResponse(res, STATUS_CODES.OK, 'Login successful', {
            user: user.toPublicJSON(),
            token: tokens.accessToken,
        });
    }),
};
