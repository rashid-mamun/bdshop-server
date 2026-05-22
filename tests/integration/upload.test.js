const jwt = require('jsonwebtoken');

jest.mock('../../src/config/cloudinary', () => ({
    __esModule: true,
    default: {
        uploader: {
            upload: jest.fn(),
        },
    },
}));

const request = require('supertest');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const userModule = require('../../src/models/user');
const User = userModule.default || userModule.User || userModule;
const cloudinary = require('../../src/config/cloudinary').default;
const { STATUS_CODES } = require('../../src/constants/statusCodes');

const TEST_JWT_SECRET = 'test-secret-key';

describe('Upload Endpoints', () => {
    let adminUser;
    let adminToken;
    let userToken;

    beforeEach(async () => {
        await User.deleteMany({});

        adminUser = new User({
            email: 'admin@example.com',
            displayName: 'Admin User',
            password: 'password123',
            phone: '+8801000000301',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'admin',
        });
        await adminUser.save();

        const regularUser = new User({
            email: 'user@example.com',
            displayName: 'Regular User',
            password: 'password123',
            phone: '+8801000000302',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'user',
        });
        await regularUser.save();

        adminToken = jwt.sign(
            { id: adminUser._id, email: adminUser.email, role: adminUser.role },
            TEST_JWT_SECRET,
            { expiresIn: '1h' },
        );
        userToken = jwt.sign(
            { id: regularUser._id, email: regularUser.email, role: regularUser.role },
            TEST_JWT_SECRET,
            { expiresIn: '1h' },
        );

        cloudinary.uploader.upload.mockResolvedValue({
            secure_url: 'https://cdn.example.com/image.jpg',
            public_id: 'bdshop_assets/test-image',
        });
    });

    afterEach(async () => {
        await User.deleteMany({});
        jest.clearAllMocks();
    });

    it('should return 401 without authentication', async () => {
        const response = await request(app).post('/api/upload').expect(STATUS_CODES.UNAUTHORIZED);

        expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-admin user', async () => {
        const response = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${userToken}`)
            .expect(STATUS_CODES.FORBIDDEN);

        expect(response.body.success).toBe(false);
    });

    it('should return 400 when no file provided', async () => {
        const response = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(STATUS_CODES.BAD_REQUEST);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('No image file provided');
    });

    it('should upload image successfully', async () => {
        const response = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${adminToken}`)
            .attach('image', Buffer.from('fake-image-bytes'), 'test.jpg')
            .expect(STATUS_CODES.OK);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Image uploaded successfully');
        expect(response.body.data.url).toBe('https://cdn.example.com/image.jpg');
    });
});
