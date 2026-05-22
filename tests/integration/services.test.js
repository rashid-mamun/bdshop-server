const request = require('supertest');
const mongoose = require('mongoose');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const serviceModule = require('../../src/models/services');
const Service = serviceModule.default || serviceModule.Service || serviceModule;
const userModule = require('../../src/models/user');
const User = userModule.default || userModule.User || userModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../src/constants/messages');
const jwt = require('jsonwebtoken');
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('Service Endpoints', () => {
    let testService;
    let adminUser;
    let adminToken;

    beforeEach(async () => {
        await Service.deleteMany({});
        await User.deleteMany({});

        // Create admin user
        adminUser = new User({
            email: 'admin@example.com',
            displayName: 'Admin User',
            password: 'password123',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'admin',
        });
        await adminUser.save();

        // Generate JWT token for admin user
        adminToken = jwt.sign(
            { id: adminUser._id, email: adminUser.email, role: adminUser.role },
            TEST_JWT_SECRET,
            { expiresIn: '1h' },
        );

        // Create test service
        testService = new Service({
            name: 'Test Service',
            model: 'Test Model',
            img: 'test-image.jpg',
            price: 1000,
            description: 'Test service description',
            config: 'Test configuration',
            category: 'electronics',
            madeIn: 'Bangladesh',
        });
        await testService.save();
    });

    afterEach(async () => {
        await Service.deleteMany({});
        await User.deleteMany({});
    });

    describe('GET /api/services', () => {
        it('should get all services with pagination', async () => {
            const response = await request(app)
                .get('/api/services?page=1&limit=10')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVICES_FETCHED);
            expect(response.body.data).toHaveProperty('services');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.services)).toBe(true);
        });

        it('should filter services by category', async () => {
            const response = await request(app)
                .get('/api/services?category=electronics')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.services.every((service) => service.category === 'electronics'),
            ).toBe(true);
        });

        it('should filter services by price range', async () => {
            const response = await request(app)
                .get('/api/services?minPrice=500&maxPrice=1500')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.services.every(
                    (service) => service.price >= 500 && service.price <= 1500,
                ),
            ).toBe(true);
        });

        it('should search services by name', async () => {
            const response = await request(app)
                .get('/api/services?search=Test')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(
                response.body.data.services.every((service) =>
                    service.name.toLowerCase().includes('test'),
                ),
            ).toBe(true);
        });

        it('should handle empty results', async () => {
            const response = await request(app)
                .get('/api/services?category=nonexistent')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.services).toHaveLength(0);
        });
    });

    describe('GET /api/services/:id', () => {
        it('should get service by ID successfully', async () => {
            const response = await request(app)
                .get(`/api/services/${testService._id}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVICE_FETCHED);
            expect(response.body.data._id).toBe(testService._id.toString());
            expect(response.body.data.name).toBe(testService.name);
        });

        it('should return 404 for non-existent service', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/services/${fakeId}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.SERVICE_NOT_FOUND);
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/services/invalid-id')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/services/categories/all', () => {
        it('should get all service categories', async () => {
            const response = await request(app)
                .get('/api/services/categories/all')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data).toContain('electronics');
        });
    });

    describe('POST /api/services', () => {
        it('should create new service successfully', async () => {
            const serviceData = {
                name: 'New Service',
                model: 'New Model',
                img: 'new-image.jpg',
                price: 2000,
                description: 'New service description',
                config: 'New configuration',
                category: 'clothing',
                madeIn: 'Bangladesh',
            };

            const response = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(serviceData)
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVICE_CREATED);
            expect(response.body.data.name).toBe(serviceData.name);
            expect(response.body.data.price).toBe(serviceData.price);
        });

        it('should return 400 for missing required fields', async () => {
            const serviceData = {
                name: 'Incomplete Service',
                // Missing required fields
            };

            const response = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(serviceData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for negative price', async () => {
            const serviceData = {
                name: 'Negative Price Service',
                model: 'Test Model',
                img: 'test.jpg',
                price: -100,
                description: 'Test description',
                config: 'Test config',
                category: 'electronics',
                madeIn: 'Bangladesh',
            };

            const response = await request(app)
                .post('/api/services')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(serviceData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without admin authentication', async () => {
            const serviceData = {
                name: 'Unauthorized Service',
                model: 'Test Model',
                img: 'test.jpg',
                price: 1000,
                description: 'Test description',
                config: 'Test config',
                category: 'electronics',
                madeIn: 'Bangladesh',
            };

            const response = await request(app)
                .post('/api/services')
                .send(serviceData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/services/:id', () => {
        it('should update service successfully', async () => {
            const updateData = {
                name: 'Updated Service Name',
                price: 1500,
                description: 'Updated description',
            };

            const response = await request(app)
                .put(`/api/services/${testService._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVICE_UPDATED);
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.price).toBe(updateData.price);
        });

        it('should return 404 for non-existent service', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = {
                name: 'Updated Name',
            };

            const response = await request(app)
                .put(`/api/services/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.SERVICE_NOT_FOUND);
        });

        it('should return 400 for invalid price', async () => {
            const updateData = {
                price: -100,
            };

            const response = await request(app)
                .put(`/api/services/${testService._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without admin authentication', async () => {
            const updateData = {
                name: 'Unauthorized Update',
            };

            const response = await request(app)
                .put(`/api/services/${testService._id}`)
                .send(updateData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/services/:id', () => {
        it('should delete service successfully', async () => {
            const serviceToDelete = new Service({
                name: 'Service to Delete',
                model: 'Delete Model',
                img: 'delete.jpg',
                price: 500,
                description: 'Service to be deleted',
                config: 'Delete config',
                category: 'electronics',
                madeIn: 'Bangladesh',
            });
            await serviceToDelete.save();

            const response = await request(app)
                .delete(`/api/services/${serviceToDelete._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVICE_DELETED);
        });

        it('should return 404 for non-existent service', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/services/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.SERVICE_NOT_FOUND);
        });

        it('should return 401 without admin authentication', async () => {
            const response = await request(app)
                .delete(`/api/services/${testService._id}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Service Statistics', () => {
        it('should get service statistics', async () => {
            const response = await request(app)
                .get('/api/services/stats/overview')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalServices');
            expect(response.body.data).toHaveProperty('categories');
            expect(response.body.data).toHaveProperty('averagePrice');
        });

        it('should return 401 without admin authentication', async () => {
            const response = await request(app)
                .get('/api/services/stats/overview')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Service Search', () => {
        it('should search services by multiple criteria', async () => {
            const response = await request(app)
                .get('/api/services/search?q=Test&category=electronics&minPrice=500&maxPrice=2000')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.services)).toBe(true);
        });

        it('should handle empty search results', async () => {
            const response = await request(app)
                .get('/api/services/search?q=nonexistent')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.services).toHaveLength(0);
        });
    });
});
