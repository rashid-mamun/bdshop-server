jest.mock('../../../src/middleware/auth', () => ({
    authenticateToken: (req, res, next) => next(),
    requireAdmin: (req, res, next) => next(),
}));

jest.mock('../../../src/config/cloudinary', () => ({
    __esModule: true,
    default: {
        uploader: {
            upload: jest.fn(),
        },
    },
}));

const express = require('express');
const request = require('supertest');
const uploadRoutes =
    require('../../../src/routes/uploadRoutes').default ||
    require('../../../src/routes/uploadRoutes');
const cloudinary = require('../../../src/config/cloudinary').default;
const { STATUS_CODES } = require('../../../src/constants/statusCodes');

describe('routes/uploadRoutes', () => {
    beforeEach(() => {
        cloudinary.uploader.upload.mockResolvedValue({
            secure_url: 'https://cdn.example.com/image.jpg',
            public_id: 'assets/1',
        });
    });

    it('should reject when no file provided', async () => {
        const app = express();
        app.use('/api/upload', uploadRoutes);

        const response = await request(app).post('/api/upload').expect(STATUS_CODES.BAD_REQUEST);

        expect(response.body.success).toBe(false);
    });

    it('should upload file successfully', async () => {
        const app = express();
        app.use('/api/upload', uploadRoutes);

        const response = await request(app)
            .post('/api/upload')
            .attach('image', Buffer.from('file-bytes'), 'test.jpg')
            .expect(STATUS_CODES.OK);

        expect(response.body.success).toBe(true);
        expect(response.body.data.url).toBe('https://cdn.example.com/image.jpg');
    });
});
