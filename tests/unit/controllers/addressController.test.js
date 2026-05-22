const { createMockRes } = require('../helpers/mockResponse');

jest.mock('../../../src/models/user', () => {
    const User = { findOne: jest.fn() };
    return { __esModule: true, default: User, User };
});

jest.mock('../../../src/models/address', () => {
    const Address = {
        countDocuments: jest.fn(),
        create: jest.fn(),
        findOne: jest.fn(),
        findOneAndDelete: jest.fn(),
        updateMany: jest.fn(),
    };
    return { __esModule: true, default: Address, Address };
});

const userModule = require('../../../src/models/user');
const addressModule = require('../../../src/models/address');
const User = userModule.default || userModule.User || userModule;
const Address = addressModule.default || addressModule.Address || addressModule;

const addressControllerModule = require('../../../src/controllers/addressController');
const addressController = addressControllerModule.default || addressControllerModule;

const flushPromises = () => new Promise(process.nextTick);

describe('controllers/addressController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        User.findOne.mockResolvedValue({ _id: 'user-id', email: 'a@b.com' });
    });

    it('should add address and set default for first address', async () => {
        Address.countDocuments.mockResolvedValue(0);
        Address.create.mockResolvedValue({ _id: 'addr', isDefault: true });
        const req = {
            body: {
                name: 'Home',
                phone: '1',
                addressLine: 'line',
                district: 'd',
                division: 'v',
            },
            user: { email: 'a@b.com' },
        };
        const res = createMockRes();

        await addressController.addAddress(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 when address not found on update', async () => {
        Address.findOne.mockResolvedValue(null);
        const req = { params: { id: 'missing' }, body: {}, user: { email: 'a@b.com' } };
        const res = createMockRes();

        await addressController.updateAddress(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should reject deleting only address', async () => {
        Address.countDocuments.mockResolvedValue(1);
        const req = { params: { id: 'addr' }, user: { email: 'a@b.com' } };
        const res = createMockRes();

        await addressController.deleteAddress(req, res, jest.fn());
        await flushPromises();

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
