jest.mock('../../../src/services/orderService', () => ({
    __esModule: true,
    default: {
        createOrder: jest.fn(),
        getOrderById: jest.fn(),
        updateOrderStatus: jest.fn(),
    },
}));

jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
        paymentIntents: { create: jest.fn() },
    }));
});

jest.mock('../../../src/models/services', () => {
    const Service = { findById: jest.fn(), updateOne: jest.fn() };
    return { __esModule: true, default: Service, Service };
});

const { createMockRes } = require('../helpers/mockResponse');
const orderService = require('../../../src/services/orderService');
const serviceModel = require('../../../src/models/services');
const Service = serviceModel.default || serviceModel.Service || serviceModel;

const orderControllerModule = require('../../../src/controllers/orderController');
const orderController = orderControllerModule.default || orderControllerModule;

describe('controllers/orderController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create order without payment method', async () => {
        Service.findById.mockResolvedValue({ _id: '1', name: 'A', price: 1, stock: 5 });
        Service.updateOne.mockResolvedValue({ modifiedCount: 1 });
        orderService.default.createOrder.mockResolvedValue({ id: '1' });
        const req = {
            body: {
                items: [{ serviceId: '1', name: 'A', price: 1, quantity: 1 }],
                total: 1,
                shippingAddress: {
                    street: 's',
                    city: 'c',
                    district: 'd',
                    division: 'd',
                    postalCode: '1',
                    country: 'x',
                    phone: '1',
                },
            },
            user: { email: 'user@example.com', role: 'user' },
        };
        const res = createMockRes();

        await orderController.createOrder(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 for missing order', async () => {
        orderService.default.getOrderById.mockRejectedValue(new Error('Order not found'));
        const req = { params: { id: 'missing' } };
        const res = createMockRes();

        await orderController.getOrderById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 for missing order on update', async () => {
        const error = new Error('Order not found');
        error.name = 'NotFoundError';
        orderService.default.updateOrderStatus.mockRejectedValue(error);
        const req = { params: { id: 'missing' }, body: { status: 'confirmed' } };
        const res = createMockRes();

        await orderController.updateOrderStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
