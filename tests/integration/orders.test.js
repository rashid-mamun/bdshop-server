const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const orderModule = require('../../src/models/orders');
const Order = orderModule.default || orderModule.Order || orderModule;
const userModule = require('../../src/models/user');
const User = userModule.default || userModule.User || userModule;
const serviceModule = require('../../src/models/services');
const Service = serviceModule.default || serviceModule.Service || serviceModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../src/constants/messages');

const TEST_JWT_SECRET = 'test-secret-key';

describe('Order Endpoints', () => {
    let testOrder;
    let testUser;
    let testService;
    let adminUser;
    let authToken;
    let adminToken;

    beforeEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Service.deleteMany({});

        // Create test user
        testUser = new User({
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'password123',
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

        // Create test order (all required fields)
        testOrder = new Order({
            email: testUser.email,
            items: [
                {
                    serviceId: testService._id,
                    name: testService.name,
                    price: testService.price,
                    quantity: 2,
                },
            ],
            total: 2000,
            shippingAddress: {
                street: '123 Test Street',
                city: 'Dhaka',
                district: 'Dhaka',
                division: 'Dhaka',
                postalCode: '1200',
                country: 'Bangladesh',
                phone: '+8801000000101',
            },
            paymentStatus: 'pending',
            status: 'pending',
        });
        await testOrder.save();
    });

    afterEach(async () => {
        await Order.deleteMany({});
        await User.deleteMany({});
        await Service.deleteMany({});
    });

    describe('POST /api/orders', () => {
        it('should create new order successfully', async () => {
            const orderData = {
                email: testUser.email,
                items: [
                    {
                        serviceId: testService._id,
                        name: testService.name,
                        price: testService.price,
                        quantity: 1,
                    },
                ],
                total: 1000,
                shippingAddress: {
                    street: '456 New Street',
                    city: 'Chittagong',
                    district: 'Chittagong',
                    division: 'Chittagong',
                    postalCode: '4000',
                    country: 'Bangladesh',
                    phone: '+8801000000102',
                },
                paymentStatus: 'pending',
                status: 'pending',
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData)
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.ORDER_CREATED);
            expect(response.body.data.email).toBe(orderData.email);
            expect(response.body.data.total).toBe(orderData.total);
            expect(response.body.data.status).toBe('pending');
        });

        it('should return 400 for missing required fields', async () => {
            const orderData = {
                email: testUser.email,
                // Missing items, total, shippingAddress
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid item quantity', async () => {
            const orderData = {
                email: testUser.email,
                items: [
                    {
                        serviceId: testService._id,
                        name: testService.name,
                        price: testService.price,
                        quantity: 0,
                    },
                ],
                total: 1000,
                shippingAddress: {
                    street: '123 Test Street',
                    city: 'Dhaka',
                    district: 'Dhaka',
                    division: 'Dhaka',
                    postalCode: '1200',
                    country: 'Bangladesh',
                    phone: '+8801000000103',
                },
                paymentStatus: 'pending',
                status: 'pending',
            };

            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${authToken}`)
                .send(orderData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const orderData = {
                email: testUser.email,
                items: [
                    {
                        serviceId: testService._id,
                        name: testService.name,
                        price: testService.price,
                        quantity: 1,
                    },
                ],
                total: 1000,
                shippingAddress: {
                    street: '123 Test Street',
                    city: 'Dhaka',
                    district: 'Dhaka',
                    division: 'Dhaka',
                    postalCode: '1200',
                    country: 'Bangladesh',
                    phone: '+8801000000104',
                },
                paymentStatus: 'pending',
                status: 'pending',
            };

            const response = await request(app)
                .post('/api/orders')
                .send(orderData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/orders', () => {
        it('should get all orders with pagination', async () => {
            const response = await request(app)
                .get('/api/orders?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.ORDERS_FETCHED);
            expect(response.body.data).toHaveProperty('orders');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.orders)).toBe(true);
        });

        it('should filter orders by status', async () => {
            const response = await request(app)
                .get('/api/orders?status=pending')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.orders.every((order) => order.status === 'pending')).toBe(
                true,
            );
        });

        it('should filter orders by email', async () => {
            const response = await request(app)
                .get(`/api/orders?email=${testUser.email}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.orders.every((order) => order.email === testUser.email)).toBe(
                true,
            );
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/orders')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/orders/my-orders', () => {
        it('should return current user orders', async () => {
            const response = await request(app)
                .get('/api/orders/my-orders')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('orders');
            expect(response.body.data.orders.every((order) => order.email === testUser.email)).toBe(
                true,
            );
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/orders/my-orders')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/orders/my-stats', () => {
        it('should return stats for current user', async () => {
            const response = await request(app)
                .get('/api/orders/my-stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('total');
            expect(response.body.data).toHaveProperty('pending');
            expect(response.body.data).toHaveProperty('completed');
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/orders/my-stats')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/orders/:id', () => {
        it('should get order by ID successfully', async () => {
            const response = await request(app)
                .get(`/api/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.ORDER_FETCHED);
            expect(response.body.data._id).toBe(testOrder._id.toString());
            expect(response.body.data.email).toBe(testOrder.email);
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/api/orders/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.ORDER_NOT_FOUND);
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/orders/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/orders/${testOrder._id}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/orders/:id', () => {
        it('should update order status successfully', async () => {
            const updateData = {
                status: 'confirmed',
                paymentStatus: 'paid',
            };

            const response = await request(app)
                .put(`/api/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.ORDER_UPDATED);
            expect(response.body.data.status).toBe(updateData.status);
            expect(response.body.data.paymentStatus).toBe(updateData.paymentStatus);
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = {
                status: 'confirmed',
            };

            const response = await request(app)
                .put(`/api/orders/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.ORDER_NOT_FOUND);
        });

        it('should return 400 for invalid status', async () => {
            const updateData = {
                status: 'invalid-status',
            };

            const response = await request(app)
                .put(`/api/orders/${testOrder._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const updateData = {
                status: 'confirmed',
            };

            const response = await request(app)
                .put(`/api/orders/${testOrder._id}`)
                .send(updateData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/orders/stats/summary', () => {
        it('should get order statistics successfully', async () => {
            const response = await request(app)
                .get('/api/orders/stats/summary')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalOrders');
            expect(response.body.data).toHaveProperty('totalRevenue');
            expect(response.body.data).toHaveProperty('ordersByStatus');
            expect(response.body.data).toHaveProperty('recentOrders');
        });

        it('should return 401 without admin authentication', async () => {
            const response = await request(app)
                .get('/api/orders/stats/summary')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.FORBIDDEN);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/orders/stats/summary')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/orders/:id', () => {
        it('should delete order successfully', async () => {
            const orderToDelete = new Order({
                email: testUser.email,
                items: [
                    {
                        serviceId: testService._id,
                        name: testService.name,
                        price: testService.price,
                        quantity: 1,
                    },
                ],
                total: 1000,
                shippingAddress: {
                    street: '123 Test Street',
                    city: 'Dhaka',
                    district: 'Dhaka',
                    division: 'Dhaka',
                    postalCode: '1200',
                    country: 'Bangladesh',
                    phone: '+8801000000105',
                },
                paymentStatus: 'pending',
                status: 'pending',
            });
            await orderToDelete.save();

            const response = await request(app)
                .delete(`/api/orders/${orderToDelete._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.ORDER_DELETED);
        });

        it('should return 404 for non-existent order', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/orders/${fakeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.ORDER_NOT_FOUND);
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .delete('/api/orders/invalid-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete(`/api/orders/${testOrder._id}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });
});
