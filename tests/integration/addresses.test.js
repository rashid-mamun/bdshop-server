const request = require('supertest');
const jwt = require('jsonwebtoken');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const addressModule = require('../../src/models/address');
const Address = addressModule.default || addressModule.Address || addressModule;
const userModule = require('../../src/models/user');
const User = userModule.default || userModule.User || userModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');

const TEST_JWT_SECRET = 'test-secret-key';

describe('Address Endpoints', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
        await Address.deleteMany({});
        await User.deleteMany({});

        testUser = new User({
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'password123',
            phone: '+8801000000201',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'user',
        });
        await testUser.save();

        authToken = jwt.sign(
            { id: testUser._id, email: testUser.email, role: testUser.role },
            TEST_JWT_SECRET,
            { expiresIn: '1h' },
        );
    });

    afterEach(async () => {
        await Address.deleteMany({});
        await User.deleteMany({});
    });

    describe('GET /api/addresses', () => {
        it('should return user addresses', async () => {
            await Address.create({
                userId: testUser._id,
                name: 'Home',
                phone: '+8801000000202',
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: true,
            });

            const response = await request(app)
                .get('/api/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(1);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/addresses')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/addresses', () => {
        it('should add address and set default for first address', async () => {
            const addressData = {
                name: 'Home',
                phone: '+8801000000203',
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
            };

            const response = await request(app)
                .post('/api/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send(addressData)
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isDefault).toBe(true);
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/addresses')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Home' })
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/addresses/:id', () => {
        it('should update an address', async () => {
            const address = await Address.create({
                userId: testUser._id,
                name: 'Home',
                phone: '+8801000000204',
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: true,
            });

            const response = await request(app)
                .put(`/api/addresses/${address._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Home',
                    phone: '+8801000000210',
                    addressLine: '123 Test Street',
                    district: 'Dhaka',
                    division: 'Dhaka',
                    postalCode: '1200',
                    isDefault: true,
                })
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Home');
        });

        it('should return 404 for non-existent address', async () => {
            const response = await request(app)
                .put('/api/addresses/65f1f1f1f1f1f1f1f1f1f1f1')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Updated Home' })
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/addresses/:id', () => {
        it('should prevent deleting the only address', async () => {
            const address = await Address.create({
                userId: testUser._id,
                name: 'Home',
                phone: '+8801000000205',
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: true,
            });

            const response = await request(app)
                .delete(`/api/addresses/${address._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Cannot delete your only address');
        });

        it('should delete and set another address as default', async () => {
            const address1 = await Address.create({
                userId: testUser._id,
                name: 'Home',
                phone: '+8801000000206',
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: true,
            });

            const address2 = await Address.create({
                userId: testUser._id,
                name: 'Office',
                phone: '+8801000000207',
                addressLine: '456 Test Ave',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: false,
            });

            const response = await request(app)
                .delete(`/api/addresses/${address1._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);

            const remaining = await Address.findById(address2._id);
            expect(remaining.isDefault).toBe(true);
        });
    });

    describe('PATCH /api/addresses/:id/set-default', () => {
        it('should set an address as default', async () => {
            const address1 = await Address.create({
                userId: testUser._id,
                name: 'Home',
                phone: '+8801000000208',
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: true,
            });

            const address2 = await Address.create({
                userId: testUser._id,
                name: 'Office',
                phone: '+8801000000209',
                addressLine: '456 Test Ave',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: false,
            });

            const response = await request(app)
                .patch(`/api/addresses/${address2._id}/set-default`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(address2._id.toString());
            expect(response.body.data.isDefault).toBe(true);

            const previous = await Address.findById(address1._id);
            expect(previous.isDefault).toBe(false);
        });

        it('should keep the current default when the requested address does not exist', async () => {
            const currentDefault = await Address.create({
                userId: testUser._id,
                name: 'Home',
                phone: '+8801000000211',
                addressLine: '123 Test Street',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                isDefault: true,
            });

            await request(app)
                .patch('/api/addresses/65f1f1f1f1f1f1f1f1f1f1f1/set-default')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            const unchanged = await Address.findById(currentDefault._id);
            expect(unchanged.isDefault).toBe(true);
        });
    });
});
