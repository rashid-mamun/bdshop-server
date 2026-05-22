jest.mock('../../../src/services/publicService', () => ({
    __esModule: true,
    default: {
        getBlogById: jest.fn(),
        getTeamMemberById: jest.fn(),
    },
}));

const { createMockRes } = require('../helpers/mockResponse');
const publicService = require('../../../src/services/publicService');

const publicControllerModule = require('../../../src/controllers/publicController');
const publicController = publicControllerModule.default || publicControllerModule;

describe('controllers/publicController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 404 when blog not found', async () => {
        publicService.default.getBlogById.mockRejectedValue(new Error('Blog not found'));
        const req = { params: { id: 'missing' } };
        const res = createMockRes();

        await publicController.getBlogById(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 when team member not found', async () => {
        publicService.default.getTeamMemberById.mockRejectedValue(new Error('Team member not found'));
        const req = { params: { id: 'missing' } };
        const res = createMockRes();

        await publicController.getTeamMemberById(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
