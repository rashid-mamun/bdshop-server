jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin, optionalAuth } = require('../../../src/middleware/auth');
const { ERROR_MESSAGES } = require('../../../src/constants/messages');
const { createMockRes } = require('../helpers/mockResponse');

describe('middleware/auth', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject when no token is provided', () => {
        const req = { headers: {}, cookies: {} };
        const res = createMockRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalled();
    });

    it('should accept valid token', () => {
        jwt.verify.mockReturnValue({ id: '1', email: 'a@b.com', role: 'user' });
        const req = { headers: { authorization: 'Bearer token' }, cookies: {} };
        const res = createMockRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should reject expired token', () => {
        const error = new Error('expired');
        error.name = 'TokenExpiredError';
        jwt.verify.mockImplementation(() => {
            throw error;
        });
        const req = { headers: { authorization: 'Bearer token' }, cookies: {} };
        const res = createMockRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: ERROR_MESSAGES.TOKEN_EXPIRED }),
        );
    });

    it('should reject invalid token', () => {
        jwt.verify.mockImplementation(() => {
            throw new Error('bad');
        });
        const req = { headers: { authorization: 'Bearer token' }, cookies: {} };
        const res = createMockRes();
        const next = jest.fn();

        authenticateToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: ERROR_MESSAGES.INVALID_TOKEN }),
        );
    });

    it('should reject non-admin user', () => {
        const req = { user: { role: 'user' } };
        const res = createMockRes();
        const next = jest.fn();

        requireAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin user', () => {
        const req = { user: { role: 'admin' } };
        const res = createMockRes();
        const next = jest.fn();

        requireAdmin(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it('should skip optional auth when no token', () => {
        const req = { headers: {}, cookies: {} };
        const res = createMockRes();
        const next = jest.fn();

        optionalAuth(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});
