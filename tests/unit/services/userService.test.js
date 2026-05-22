jest.mock('../../../src/models/user', () => {
    const User = { findOne: jest.fn() };
    return { __esModule: true, default: User, User };
});

const userService = require('../../../src/services/userService').default;
const userModule = require('../../../src/models/user');
const User = userModule.default || userModule.User || userModule;

describe('services/userService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw when user is not found', async () => {
        User.findOne.mockResolvedValue(null);
        await expect(userService.getUserByEmail('missing@example.com')).rejects.toThrow(
            'User not found',
        );
    });
});
