const {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    sendSuccessResponse,
    sendErrorResponse,
} = require('../../../src/utils/response');
const { createMockRes } = require('../helpers/mockResponse');

describe('utils/response', () => {
    it('should build success response with data', () => {
        const response = createSuccessResponse({ ok: true }, 'Done', 201);
        expect(response.success).toBe(true);
        expect(response.message).toBe('Done');
        expect(response.data).toEqual({ ok: true });
        expect(response).toHaveProperty('timestamp');
    });

    it('should build error response', () => {
        const response = createErrorResponse(new Error('fail'), 500);
        expect(response.success).toBe(false);
        expect(response.error).toBe('fail');
    });

    it('should build paginated response', () => {
        const response = createPaginatedResponse([1, 2], 1, 10, 2);
        expect(response.pagination.total).toBe(2);
        expect(response.pagination.pages).toBe(1);
    });

    it('should send success response', () => {
        const res = createMockRes();
        sendSuccessResponse(res, 200, 'Ok', { id: 1 });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
    });

    it('should send error response', () => {
        const res = createMockRes();
        sendErrorResponse(res, 400, 'Bad');
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalled();
    });
});
