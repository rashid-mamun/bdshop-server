const cartService = require('../../../src/services/cartService').default;

describe('services/cartService', () => {
    it('should throw validation error for invalid quantity', async () => {
        await expect(cartService.updateCartItemQuantity('id', 0)).rejects.toThrow(
            'Quantity must be at least 1',
        );
    });
});
