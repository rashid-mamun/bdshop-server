jest.mock('../../../src/models/reviews', () => {
    const Review = { find: jest.fn() };
    return { __esModule: true, default: Review, Review };
});

const reviewService = require('../../../src/services/reviewService').default;
const reviewModule = require('../../../src/models/reviews');
const Review = reviewModule.default || reviewModule.Review || reviewModule;

describe('services/reviewService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return zero stats when no reviews', async () => {
        Review.find.mockResolvedValue([]);
        const stats = await reviewService.getReviewStatistics('service-id');
        expect(stats.totalReviews).toBe(0);
        expect(stats.averageRating).toBe(0);
        expect(stats.ratingDistribution[1]).toBe(0);
    });
});
