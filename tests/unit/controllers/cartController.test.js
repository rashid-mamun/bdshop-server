jest.mock('../../../src/services/cartService', () => ({
    __esModule: true,
    default: {
        addToCart: jest.fn(),
        updateCartItemQuantity: jest.fn(),
    },
}));

jest.mock('../../../src/models/carts', () => {
    const Cart = { findById: jest.fn() };
    return { __esModule: true, default: Cart, Cart };
});

const { createMockRes } = require('../helpers/mockResponse');
const cartService = require('../../../src/services/cartService');
const cartModel = require('../../../src/models/carts');
const Cart = cartModel.default || cartModel.Cart || cartModel;

const cartControllerModule = require('../../../src/controllers/cartController');
const cartController = cartControllerModule.default || cartControllerModule;

describe('controllers/cartController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should add item to cart (created)', async () => {
        cartService.default.addToCart.mockResolvedValue({
            cartItem: { _id: '1', id: 'p1', email: 'a@b.com', price: 1, quantity: 1 },
            created: true,
        });
        const req = { body: { id: 'p1' }, user: { email: 'a@b.com', role: 'user' } };
        const res = createMockRes();

        await cartController.addToCart(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 404 when updating missing cart item', async () => {
        Cart.findById.mockResolvedValue(null);
        const req = {
            params: { id: 'missing' },
            body: { quantity: 2 },
            user: { email: 'a@b.com', role: 'user' },
        };
        const res = createMockRes();

        await cartController.updateCartItemQuantity(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
