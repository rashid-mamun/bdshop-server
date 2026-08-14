const request = require('supertest');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const mongoose = require('mongoose');
const blogModule = require('../../src/models/blogs');
const Blog = blogModule.default || blogModule.Blog || blogModule;
const teamModule = require('../../src/models/ourTeams');
const TeamMember = teamModule.default || teamModule.OurTeam || teamModule;
const orderModule = require('../../src/models/orders');
const Order = orderModule.default || orderModule.Order || orderModule;
const returnModule = require('../../src/models/returnRequest');
const ReturnRequest = returnModule.default || returnModule.ReturnRequest || returnModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../src/constants/messages');

describe('Public Endpoints', () => {
    // No beforeAll/afterAll for DB connection
    // Add test data setup/cleanup if needed

    describe('GET /', () => {
        it('should return welcome message and API information', async () => {
            const response = await request(app).get('/').expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('BdShop Server API');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('endpoints');
            expect(Array.isArray(response.body.endpoints)).toBe(true);
        });

        it('should include all available endpoints', async () => {
            const response = await request(app).get('/').expect(STATUS_CODES.OK);

            const expectedEndpoints = [
                '/api/users',
                '/api/services',
                '/api/orders',
                '/api/carts',
                '/api/reviews',
            ];

            expectedEndpoints.forEach((endpoint) => {
                expect(response.body.endpoints).toContain(endpoint);
            });
        });

        it('should include documentation link', async () => {
            const response = await request(app).get('/').expect(STATUS_CODES.OK);

            expect(response.body).toHaveProperty('documentation');
            expect(response.body.documentation).toBe('/docs');
        });
    });

    describe('GET /health', () => {
        it('should return server health status', async () => {
            const response = await request(app).get('/health').expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVER_HEALTHY);
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('environment');
            expect(response.body).toHaveProperty('version');
        });

        it('should include proper timestamp format', async () => {
            const response = await request(app).get('/health').expect(STATUS_CODES.OK);

            const timestamp = new Date(response.body.timestamp);
            expect(timestamp instanceof Date).toBe(true);
            expect(timestamp.toString()).not.toBe('Invalid Date');
        });

        it('should handle multiple concurrent health checks', async () => {
            const promises = Array(5)
                .fill()
                .map(() => request(app).get('/health').expect(STATUS_CODES.OK));

            const responses = await Promise.all(promises);

            responses.forEach((response) => {
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVER_HEALTHY);
            });
        });
    });

    describe('GET /blogs', () => {
        beforeEach(async () => {
            await Blog.deleteMany({});
            await Blog.insertMany([
                {
                    title: 'Test Blog 1',
                    img: 'blog1.jpg',
                    description: 'Blog description 1',
                    date: '2024-01-01',
                    category: 'news',
                },
                {
                    title: 'Test Blog 2',
                    img: 'blog2.jpg',
                    description: 'Blog description 2',
                    date: '2024-01-02',
                    category: 'tips',
                },
            ]);
        });

        afterEach(async () => {
            await Blog.deleteMany({});
        });

        it('should return blogs with pagination', async () => {
            const response = await request(app)
                .get('/blogs?page=1&limit=1')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('blogs');
            expect(response.body.data).toHaveProperty('pagination');
            expect(response.body.data.blogs.length).toBe(1);
        });
    });

    describe('GET /blogs/:id', () => {
        let blog;

        beforeEach(async () => {
            await Blog.deleteMany({});
            blog = await Blog.create({
                title: 'Blog Detail',
                img: 'blog-detail.jpg',
                description: 'Blog detail description',
                date: '2024-02-01',
                category: 'news',
            });
        });

        afterEach(async () => {
            await Blog.deleteMany({});
        });

        it('should return blog by id', async () => {
            const response = await request(app).get(`/blogs/${blog._id}`).expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(blog._id.toString());
        });

        it('should return 404 for non-existent blog', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/blogs/${fakeId}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Blog not found');
        });

        it('should return 400 for invalid blog id format', async () => {
            const response = await request(app)
                .get('/blogs/invalid-id')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid blog ID format');
        });
    });

    describe('GET /team', () => {
        beforeEach(async () => {
            await TeamMember.deleteMany({});
            await TeamMember.insertMany([
                {
                    name: 'Team Member 1',
                    img: 'member1.jpg',
                    position: 'Developer',
                    bio: 'Bio 1',
                },
                {
                    name: 'Team Member 2',
                    img: 'member2.jpg',
                    position: 'Designer',
                    bio: 'Bio 2',
                },
            ]);
        });

        afterEach(async () => {
            await TeamMember.deleteMany({});
        });

        it('should return team members', async () => {
            const response = await request(app).get('/team').expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2);
        });
    });

    describe('GET /team/:id', () => {
        let teamMember;

        beforeEach(async () => {
            await TeamMember.deleteMany({});
            teamMember = await TeamMember.create({
                name: 'Team Member Detail',
                img: 'member-detail.jpg',
                position: 'Manager',
                bio: 'Detail bio',
            });
        });

        afterEach(async () => {
            await TeamMember.deleteMany({});
        });

        it('should return team member by id', async () => {
            const response = await request(app)
                .get(`/team/${teamMember._id}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data._id).toBe(teamMember._id.toString());
        });

        it('should return 404 for non-existent team member', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .get(`/team/${fakeId}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Team member not found');
        });

        it('should return 400 for invalid team member id format', async () => {
            const response = await request(app)
                .get('/team/invalid-id')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid team member ID format');
        });
    });

    describe('POST /returns', () => {
        let order;

        beforeEach(async () => {
            await ReturnRequest.deleteMany({});
            await Order.deleteMany({});
            order = await Order.create({
                email: 'buyer@example.com',
                items: [
                    {
                        serviceId: new mongoose.Types.ObjectId(),
                        name: 'Test product',
                        price: 1000,
                        quantity: 1,
                    },
                ],
                subtotal: 1000,
                shippingFee: 120,
                tax: 0,
                discount: 0,
                total: 1120,
                shippingAddress: {
                    street: '123 Test Street',
                    district: 'Dhaka',
                    division: 'Dhaka',
                    postalCode: '1200',
                    country: 'Bangladesh',
                    phone: '+8801000000220',
                },
            });
        });

        afterEach(async () => {
            await ReturnRequest.deleteMany({});
            await Order.deleteMany({});
        });

        it('should accept the customer-facing order number', async () => {
            const response = await request(app)
                .post('/returns')
                .send({
                    orderId: order.orderNumber,
                    email: 'buyer@example.com',
                    itemScope: 'entire_order',
                    reason: 'damaged',
                    details: 'Package arrived damaged',
                })
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);
            expect(response.body.data.orderId).toBe(order._id.toString());
        });

        it('should not expose another customer order by number', async () => {
            await request(app)
                .post('/returns')
                .send({
                    orderId: order.orderNumber,
                    email: 'someone-else@example.com',
                    itemScope: 'entire_order',
                    reason: 'wrong',
                })
                .expect(STATUS_CODES.NOT_FOUND);
        });
    });

    describe('GET /api/services (Public Access)', () => {
        it('should allow public access to services list', async () => {
            const response = await request(app).get('/api/services').expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Services fetched successfully');
            expect(response.body.data).toHaveProperty('services');
            expect(response.body.data).toHaveProperty('pagination');
        });

        it('should support pagination for public access', async () => {
            const response = await request(app)
                .get('/api/services?page=1&limit=5')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(5);
        });

        it('should support filtering by category for public access', async () => {
            const response = await request(app)
                .get('/api/services?category=electronics')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.services)).toBe(true);
        });

        it('should support search functionality for public access', async () => {
            const response = await request(app)
                .get('/api/services?search=test')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.services)).toBe(true);
        });
    });

    describe('GET /api/services/:id (Public Access)', () => {
        it('should return 400 for invalid service ID format', async () => {
            const response = await request(app)
                .get('/api/services/invalid-id')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/services/categories/all (Public Access)', () => {
        it('should allow public access to service categories', async () => {
            const response = await request(app)
                .get('/api/services/categories/all')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/reviews (Public Access)', () => {
        it('should allow public access to reviews list', async () => {
            const response = await request(app).get('/api/reviews').expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Reviews fetched successfully');
            expect(response.body.data).toHaveProperty('reviews');
            expect(response.body.data).toHaveProperty('pagination');
        });

        it('should support filtering reviews by rating for public access', async () => {
            const response = await request(app)
                .get('/api/reviews?rating=5')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.reviews)).toBe(true);
        });

        it('should support pagination for reviews public access', async () => {
            const response = await request(app)
                .get('/api/reviews?page=1&limit=10')
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(10);
        });
    });

    describe('GET /api/reviews/:id (Public Access)', () => {
        it('should return 400 for invalid review ID format', async () => {
            const response = await request(app)
                .get('/api/reviews/invalid-id')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('CORS Headers', () => {
        it('should include CORS headers in responses', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:3000')
                .expect(STATUS_CODES.OK);

            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        });

        it('should handle preflight requests correctly', async () => {
            const response = await request(app)
                .options('/health')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'GET')
                .expect(STATUS_CODES.NO_CONTENT);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
            expect(response.headers['access-control-allow-methods']).toBeDefined();
        });
    });

    describe('Security Headers', () => {
        it('should include security headers from Helmet', async () => {
            const response = await request(app).get('/health').expect(STATUS_CODES.OK);

            // Check for common security headers
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBeDefined();
            expect(response.headers['x-xss-protection']).toBeDefined();
        });

        it('should include content-type header', async () => {
            const response = await request(app).get('/health').expect(STATUS_CODES.OK);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/nonexistent-route')
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Route not found');
        });

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should handle unsupported HTTP methods', async () => {
            const response = await request(app)
                .patch('/health')
                .expect(STATUS_CODES.METHOD_NOT_ALLOWED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('API Versioning', () => {
        it('should use correct API prefix', async () => {
            const response = await request(app).get('/').expect(STATUS_CODES.OK);

            // Check that endpoints use the correct API prefix
            response.body.endpoints.forEach((endpoint) => {
                expect(endpoint).toMatch(/^\/api\//);
            });
        });
    });
});
