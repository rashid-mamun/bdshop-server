jest.mock('../../../src/services/userService', () => ({
    __esModule: true,
    default: {
        createUser: jest.fn(),
        verifyUserPassword: jest.fn(),
        getUserByEmail: jest.fn(),
    },
}));

jest.mock('../../../src/utils/jwt', () => ({
    generateTokens: jest.fn(),
    setAuthCookies: jest.fn(),
    clearAuthCookies: jest.fn(),
}));

const { createMockRes } = require('../helpers/mockResponse');
const userService = require('../../../src/services/userService');
const jwtUtils = require('../../../src/utils/jwt');

const userControllerModule = require('../../../src/controllers/userController');
const userController = userControllerModule.default || userControllerModule;

const flushPromises = () => new Promise(process.nextTick);

const mockUser = {
    _id: { toString: () => 'user-id' },
    email: 'test@example.com',
    role: 'user',
    toPublicJSON: () => ({ email: 'test@example.com' }),
};

describe('controllers/userController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create user and set cookies', async () => {
        userService.default.createUser.mockResolvedValue(mockUser);
        jwtUtils.generateTokens.mockReturnValue({
            accessToken: 'access',
            refreshToken: 'refresh',
        });
        const req = { body: { email: 'test@example.com' } };
        const res = createMockRes();

        await userController.createUser(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(201);
        expect(jwtUtils.setAuthCookies).toHaveBeenCalled();
    });

    it('should return 400 for duplicate user', async () => {
        const error = new Error('dup');
        error.code = 11000;
        error.keyPattern = { email: 1 };
        userService.default.createUser.mockRejectedValue(error);
        const req = { body: { email: 'test@example.com' } };
        const res = createMockRes();

        await userController.createUser(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject login when missing credentials', async () => {
        const req = { body: { email: 'test@example.com' } };
        const res = createMockRes();

        await userController.login(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject login with invalid credentials', async () => {
        userService.default.verifyUserPassword.mockResolvedValue(null);
        const req = { body: { email: 'test@example.com', password: 'bad' } };
        const res = createMockRes();

        await userController.login(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should logout and clear cookies', async () => {
        const req = {};
        const res = createMockRes();

        await userController.logout(req, res, jest.fn());
        await flushPromises();

        expect(jwtUtils.clearAuthCookies).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject refresh when cookie missing', async () => {
        const req = { cookies: {} };
        const res = createMockRes();

        await userController.refreshToken(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(401);
    });
});
