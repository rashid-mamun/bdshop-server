jest.mock('../../../src/models/orders', () => {
    const Order = { findByIdAndUpdate: jest.fn() };
    return { __esModule: true, default: Order, Order };
});

const orderService = require('../../../src/services/orderService').default;
const orderModule = require('../../../src/models/orders');
const Order = orderModule.default || orderModule.Order || orderModule;

describe('services/orderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject invalid status', async () => {
        await expect(orderService.updateOrderStatus('id', { status: 'bad' })).rejects.toThrow(
            'Invalid status',
        );
        expect(Order.findByIdAndUpdate).not.toHaveBeenCalled();
    });
});
