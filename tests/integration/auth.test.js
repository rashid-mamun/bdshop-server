const request = require('supertest');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const userModule = require('../../src/models/user');
const User = userModule.default || userModule.User || userModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');

const originalFetch = global.fetch;

describe('Auth Endpoints', () => {
    beforeEach(async () => {
        await User.deleteMany({});
        global.fetch = jest.fn();
    });

    afterEach(async () => {
        await User.deleteMany({});
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    describe('POST /api/auth/google', () => {
        it('should return 400 for missing token', async () => {
            const response = await request(app)
                .post('/api/auth/google')
                .send({})
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('No token provided');
        });

        it('should return 401 for invalid token', async () => {
            global.fetch.mockResolvedValue({ ok: false });

            const response = await request(app)
                .post('/api/auth/google')
                .send({ token: 'invalid-google-token' })
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid Google token');
        });

        it('should login and create user for valid token', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    sub: 'google-123',
                    name: 'Google User',
                    email: 'google@example.com',
                    picture: 'google.jpg',
                }),
            });

            const response = await request(app)
                .post('/api/auth/google')
                .send({ token: 'valid-google-token' })
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('google@example.com');
            expect(response.headers['set-cookie']).toBeDefined();
        });
    });

    describe('POST /api/auth/facebook', () => {
        it('should return 400 for missing access token', async () => {
            const response = await request(app)
                .post('/api/auth/facebook')
                .send({})
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid request');
        });

        it('should return 401 for invalid token', async () => {
            global.fetch.mockResolvedValue({ ok: false });

            const response = await request(app)
                .post('/api/auth/facebook')
                .send({ accessToken: 'invalid', userID: '123' })
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid Facebook token');
        });

        it('should login and create user for valid token', async () => {
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    id: 'facebook-123',
                    name: 'Facebook User',
                    email: 'facebook@example.com',
                    picture: { data: { url: 'facebook.jpg' } },
                }),
            });

            const response = await request(app)
                .post('/api/auth/facebook')
                .send({ accessToken: 'valid', userID: 'facebook-123' })
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('facebook@example.com');
            expect(response.headers['set-cookie']).toBeDefined();
        });
    });
});
