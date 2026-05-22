import jwt from 'jsonwebtoken';
import environment from '../config/environment';
import { Response } from 'express';

interface TokenPayload {
    id: string;
    email: string;
    role: string;
}

export const generateTokens = (payload: TokenPayload) => {
    const accessToken = jwt.sign(payload, environment.JWT_SECRET as string, {
        expiresIn: environment.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, environment.JWT_REFRESH_SECRET as string, {
        expiresIn: environment.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
};

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const isProduction = environment.NODE_ENV === 'production';

    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ('none' as const) : ('lax' as const),
        path: '/',
    };

    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
};

export const clearAuthCookies = (res: Response) => {
    const isProduction = environment.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? ('none' as const) : ('lax' as const),
        path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
};
