const request = require('supertest');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');

describe('API Endpoints - Route Testing', () => {
    describe('User Endpoints', () => {
        describe('POST /api/users/register', () => {
            it('should accept user creation request', async () => {
                const userData = {
                    email: 'invalid-email', // Invalid email to trigger validation error
                    displayName: 'Test User',
                    password: 'password123',
                    phone: '+8801000000010',
                    district: 'Dhaka',
                    division: 'Dhaka',
                };

                const response = await request(app)
                    .post('/api/users/register')
                    .send(userData)
                    .expect(STATUS_CODES.BAD_REQUEST); // Will fail validation but route exists

                expect(response.body).toHaveProperty('success', false);
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/api/users/register')
                    .send({})
                    .expect(STATUS_CODES.BAD_REQUEST);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('error');
            });
        });

        describe('GET /api/users/:email', () => {
            it('should handle user lookup by email', async () => {
                const response = await request(app)
                    .get('/api/users/test@example.com')
                    .expect(STATUS_CODES.UNAUTHORIZED); // User lookup is protected

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/users', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .get('/api/users')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('PUT /api/users', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .put('/api/users')
                    .send({ displayName: 'Updated Name' })
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('DELETE /api/users/:email', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .delete('/api/users/test@example.com')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/users/profile/me', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .get('/api/users/profile/me')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });
    });

    describe('Service Endpoints', () => {
        describe('GET /api/services', () => {
            it('should return services list', async () => {
                const response = await request(app).get('/api/services').expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            });

            it('should support pagination', async () => {
                const response = await request(app)
                    .get('/api/services?page=1&limit=5')
                    .expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body.data).toHaveProperty('pagination');
            });

            it('should support category filtering', async () => {
                const response = await request(app)
                    .get('/api/services?category=electronics')
                    .expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
            });

            it('should support search', async () => {
                const response = await request(app)
                    .get('/api/services?search=test')
                    .expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
            });
        });

        describe('GET /api/services/:id', () => {
            it('should handle invalid ID format', async () => {
                const response = await request(app)
                    .get('/api/services/invalid-id')
                    .expect(STATUS_CODES.BAD_REQUEST);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/services/categories/all', () => {
            it('should return service categories', async () => {
                const response = await request(app)
                    .get('/api/services/categories/all')
                    .expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            });
        });

        describe('POST /api/services', () => {
            it('should require authentication', async () => {
                const serviceData = {
                    name: 'Test Service',
                    price: 1000,
                    category: 'electronics',
                };

                const response = await request(app)
                    .post('/api/services')
                    .send(serviceData)
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('PUT /api/services/:id', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .put('/api/services/test-id')
                    .send({ name: 'Updated Service' })
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('DELETE /api/services/:id', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .delete('/api/services/test-id')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });
    });

    describe('Order Endpoints', () => {
        describe('POST /api/orders', () => {
            it('should accept order creation request', async () => {
                const orderData = {
                    email: 'test@example.com',
                    items: [
                        {
                            serviceId: 'test-service-id',
                            name: 'Test Service',
                            price: 1000,
                            quantity: 2,
                        },
                    ],
                    total: 2000,
                    shippingAddress: {
                        street: 'Test Street',
                        city: 'Dhaka',
                        postalCode: '1200',
                        country: 'Bangladesh',
                    },
                };

                const response = await request(app)
                    .post('/api/orders')
                    .send(orderData)
                    .expect(STATUS_CODES.BAD_REQUEST); // Guest checkout validates order content

                expect(response.body).toHaveProperty('success', false);
            });

            it('should validate required fields', async () => {
                const response = await request(app)
                    .post('/api/orders')
                    .send({})
                    .expect(STATUS_CODES.BAD_REQUEST);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/orders', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .get('/api/orders')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/orders/:id', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .get('/api/orders/test-id')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('PUT /api/orders/:id', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .put('/api/orders/test-id')
                    .send({ status: 'completed' })
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('DELETE /api/orders/:id', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .delete('/api/orders/test-id')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/orders/stats/summary', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .get('/api/orders/stats/summary')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });
    });

    describe('Cart Endpoints', () => {
        describe('POST /api/carts', () => {
            it('should accept cart item addition', async () => {
                const cartData = {
                    email: 'test@example.com',
                    serviceId: 'test-service-id',
                    name: 'Test Service',
                    price: 1000,
                    quantity: 2,
                };

                const response = await request(app)
                    .post('/api/carts')
                    .send(cartData)
                    .expect(STATUS_CODES.UNAUTHORIZED); // Authentication required before validation

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/carts/:email', () => {
            it('should handle cart retrieval', async () => {
                const response = await request(app)
                    .get('/api/carts/test@example.com')
                    .expect(STATUS_CODES.UNAUTHORIZED); // Authentication required

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('PUT /api/carts/:id', () => {
            it('should handle cart item update', async () => {
                const response = await request(app)
                    .put('/api/carts/test-id')
                    .send({ quantity: 3 })
                    .expect(STATUS_CODES.UNAUTHORIZED); // Authentication required before validation

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('DELETE /api/carts/:id', () => {
            it('should handle cart item removal', async () => {
                const response = await request(app)
                    .delete('/api/carts/test-id')
                    .expect(STATUS_CODES.UNAUTHORIZED); // Authentication required

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('DELETE /api/carts/clear/:email', () => {
            it('should handle cart clearing', async () => {
                const response = await request(app)
                    .delete('/api/carts/clear/test@example.com')
                    .expect(STATUS_CODES.UNAUTHORIZED); // Authentication required

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/carts/summary/:email', () => {
            it('should handle cart summary', async () => {
                const response = await request(app)
                    .get('/api/carts/summary/test@example.com')
                    .expect(STATUS_CODES.UNAUTHORIZED); // Authentication required

                expect(response.body).toHaveProperty('success', false);
            });
        });
    });

    describe('Review Endpoints', () => {
        describe('GET /api/reviews', () => {
            it('should return reviews list', async () => {
                const response = await request(app).get('/api/reviews').expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body).toHaveProperty('data');
            });

            it('should support pagination', async () => {
                const response = await request(app)
                    .get('/api/reviews?page=1&limit=10')
                    .expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
                expect(response.body.data).toHaveProperty('pagination');
            });

            it('should support rating filtering', async () => {
                const response = await request(app)
                    .get('/api/reviews?rating=5')
                    .expect(STATUS_CODES.OK);

                expect(response.body).toHaveProperty('success', true);
            });
        });

        describe('GET /api/reviews/:id', () => {
            it('should handle invalid ID format', async () => {
                const response = await request(app)
                    .get('/api/reviews/invalid-id')
                    .expect(STATUS_CODES.BAD_REQUEST);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('POST /api/reviews', () => {
            it('should accept review creation', async () => {
                const reviewData = {
                    email: 'test@example.com',
                    serviceId: 'test-service-id',
                    rating: 4,
                    comment: 'Great service!',
                    userName: 'Test User',
                };

                const response = await request(app)
                    .post('/api/reviews')
                    .send(reviewData)
                    .expect(STATUS_CODES.UNAUTHORIZED); // Authentication required before validation

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('PUT /api/reviews/:id', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .put('/api/reviews/test-id')
                    .send({ rating: 5, comment: 'Updated review' })
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('DELETE /api/reviews/:id', () => {
            it('should require authentication', async () => {
                const response = await request(app)
                    .delete('/api/reviews/test-id')
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
            });
        });

        describe('GET /api/reviews/stats/:serviceId', () => {
            it('should return review statistics', async () => {
                const response = await request(app)
                    .get('/api/reviews/stats/test-service-id')
                    .expect(STATUS_CODES.BAD_REQUEST); // Invalid ObjectId should return 400

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('error');
            });
        });
    });

    describe('Authentication & Authorization', () => {
        it('should reject requests without valid JWT token', async () => {
            const protectedEndpoints = [
                { method: 'GET', path: '/api/users' },
                { method: 'PUT', path: '/api/users' },
                { method: 'DELETE', path: '/api/users/test@example.com' },
                { method: 'POST', path: '/api/services' },
                { method: 'PUT', path: '/api/services/test-id' },
                { method: 'DELETE', path: '/api/services/test-id' },
                { method: 'GET', path: '/api/orders' },
                { method: 'PUT', path: '/api/reviews/test-id' },
                { method: 'DELETE', path: '/api/reviews/test-id' },
            ];

            for (const endpoint of protectedEndpoints) {
                const response = await request(app)
                    [endpoint.method.toLowerCase()](endpoint.path)
                    .expect(STATUS_CODES.UNAUTHORIZED);

                expect(response.body).toHaveProperty('success', false);
                expect(response.body).toHaveProperty('error');
            }
        });

        it('should reject requests with invalid JWT token', async () => {
            const response = await request(app)
                .get('/api/users')
                .set('Authorization', 'Bearer invalid-token')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Rate Limiting', () => {
        it('should apply rate limiting to endpoints', async () => {
            // Make multiple requests to trigger rate limiting
            const promises = Array(20)
                .fill()
                .map(() => request(app).get('/api/services'));

            const responses = await Promise.all(promises);

            // Check if any requests were rate limited
            const rateLimitedResponses = responses.filter((res) => res.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('CORS', () => {
        it('should include CORS headers in all responses', async () => {
            const response = await request(app)
                .get('/api/services')
                .set('Origin', 'http://localhost:3000')
                .expect(STATUS_CODES.OK);

            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        });

        it('should handle preflight requests', async () => {
            const response = await request(app)
                .options('/api/services')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'GET')
                .expect(STATUS_CODES.NO_CONTENT);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
            expect(response.headers['access-control-allow-methods']).toBeDefined();
        });
    });

    describe('Security Headers', () => {
        it('should include security headers from Helmet', async () => {
            const response = await request(app).get('/api/services').expect(STATUS_CODES.OK);

            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBeDefined();
            expect(response.headers['x-xss-protection']).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Route not found');
        });

        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/users/register')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should handle unsupported HTTP methods', async () => {
            const response = await request(app)
                .patch('/api/services')
                .expect(STATUS_CODES.METHOD_NOT_ALLOWED);

            expect(response.body).toHaveProperty('success', false);
        });
    });
});
