const {
    validateUser,
    validateOrder,
    validateReview,
    validateCartQuantityUpdate,
} = require('../../../src/middleware/validation');
const { createMockRes } = require('../helpers/mockResponse');

const runMiddleware = (middleware, req, res) =>
    new Promise((resolve) => {
        middleware(req, res, () => resolve('next'));
        if (res.status.mock.calls.length > 0) resolve('response');
    });

describe('middleware/validation', () => {
    it('should reject user with missing fields', async () => {
        const req = { body: { email: 'a@b.com' } };
        const res = createMockRes();
        await runMiddleware(validateUser, req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid email', async () => {
        const req = {
            body: { email: 'bad', displayName: 'Test', password: '123456', phone: '+8801' },
        };
        const res = createMockRes();
        await runMiddleware(validateUser, req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject order with empty items', async () => {
        const req = { body: { email: 'a@b.com', items: [], total: 10, shippingAddress: {} } };
        const res = createMockRes();
        await runMiddleware(validateOrder, req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject review with invalid rating', async () => {
        const req = {
            body: { name: 'a', email: 'a@b.com', title: 'Great!', img: 'x', star: 6 },
        };
        const res = createMockRes();
        await runMiddleware(validateReview, req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject invalid cart quantity update', async () => {
        const req = { body: { quantity: 0 } };
        const res = createMockRes();
        await runMiddleware(validateCartQuantityUpdate, req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});
