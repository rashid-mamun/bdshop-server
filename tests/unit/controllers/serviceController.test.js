jest.mock('../../../src/services/serviceService', () => ({
    __esModule: true,
    default: {
        createService: jest.fn(),
        getServiceById: jest.fn(),
        updateService: jest.fn(),
    },
}));

const { createMockRes } = require('../helpers/mockResponse');
const serviceService = require('../../../src/services/serviceService');

const serviceControllerModule = require('../../../src/controllers/serviceController');
const serviceController = serviceControllerModule.default || serviceControllerModule;

describe('controllers/serviceController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create service', async () => {
        serviceService.default.createService.mockResolvedValue({ name: 'Test' });
        const req = { body: { name: 'Test' } };
        const res = createMockRes();

        await serviceController.createService(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 for invalid service id', async () => {
        const error = new Error('bad');
        error.name = 'CastError';
        serviceService.default.getServiceById.mockRejectedValue(error);
        const req = { params: { id: 'bad' } };
        const res = createMockRes();

        await serviceController.getServiceById(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when update returns null', async () => {
        serviceService.default.updateService.mockResolvedValue(null);
        const req = { params: { id: 'id' }, body: { name: 'x' } };
        const res = createMockRes();

        await serviceController.updateService(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
