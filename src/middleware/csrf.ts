import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import environment from '../config/environment';

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const cookieOptions = {
    httpOnly: false,
    secure: environment.NODE_ENV === 'production',
    sameSite: (environment.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
};

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

export const issueCsrfToken = (req: Request, res: Response) => {
    const token = req.cookies?.[CSRF_COOKIE_NAME] || createCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, cookieOptions);
    res.json({ success: true, csrfToken: token });
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    if (environment.NODE_ENV === 'test' || SAFE_METHODS.has(req.method)) {
        return next();
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
    const headerToken = req.get(CSRF_HEADER_NAME);

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ success: false, error: 'Invalid CSRF token' });
    }

    return next();
};
