jest.mock('../../../src/services/reviewService', () => ({
    __esModule: true,
    default: {
        createReview: jest.fn(),
        getReviewById: jest.fn(),
    },
}));

const { createMockRes } = require('../helpers/mockResponse');
const reviewService = require('../../../src/services/reviewService');

const reviewControllerModule = require('../../../src/controllers/reviewController');
const reviewController = reviewControllerModule.default || reviewControllerModule;

describe('controllers/reviewController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reject duplicate review', async () => {
        reviewService.default.createReview.mockRejectedValue(
            new Error('User has already reviewed this service'),
        );
        const req = { body: { email: 'a@b.com' }, user: { email: 'a@b.com', role: 'user' } };
        const res = createMockRes();

        await reviewController.createReview(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 for missing review', async () => {
        reviewService.default.getReviewById.mockRejectedValue(new Error('Review not found'));
        const req = { params: { id: 'missing' } };
        const res = createMockRes();

        await reviewController.getReviewById(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
