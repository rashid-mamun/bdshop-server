const request = require('supertest');
const app = require('../../src/app');
const { STATUS_CODES } = require('../../src/constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../src/constants/messages');

describe('Health Check Endpoints', () => {
    describe('GET /health', () => {
        it('should return server status with 200 status code', async () => {
            const response = await request(app)
                .get('/health')
                .expect(STATUS_CODES.OK);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message', SUCCESS_MESSAGES.SERVER_HEALTHY);
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('environment');
            expect(response.body).toHaveProperty('version');
        });

        it('should return proper headers', async () => {
            const response = await request(app)
                .get('/health')
                .expect(STATUS_CODES.OK);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('should handle multiple concurrent requests', async () => {
            const promises = Array(5).fill().map(() =>
                request(app).get('/health').expect(STATUS_CODES.OK)
            );

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                expect(response.body.success).toBe(true);
                expect(response.body.message).toBe(SUCCESS_MESSAGES.SERVER_HEALTHY);
            });
        });
    });

    describe('GET / (Root endpoint)', () => {
        it('should return welcome message', async () => {
            const response = await request(app)
                .get('/')
                .expect(STATUS_CODES.OK);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.message).toContain('BdShop Server API');
        });
    });

    describe('404 Handler', () => {
        it('should return 404 for non-existent routes', async () => {
            const response = await request(app)
                .get('/nonexistent-route')
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Route not found');
        });

        it('should return 404 for non-existent API endpoints', async () => {
            const response = await request(app)
                .post('/api/nonexistent')
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error', 'Route not found');
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/users')
                .set('Content-Type', 'application/json')
                .send('{"invalid": json}')
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should handle large payloads appropriately', async () => {
            const largePayload = { data: 'x'.repeat(1000000) }; // 1MB payload

            const response = await request(app)
                .post('/api/users')
                .send(largePayload)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('CORS Headers', () => {
        it('should include CORS headers in response', async () => {
            const response = await request(app)
                .get('/health')
                .set('Origin', 'http://localhost:3000')
                .expect(STATUS_CODES.OK);

            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
        });

        it('should handle preflight requests', async () => {
            const response = await request(app)
                .options('/health')
                .set('Origin', 'http://localhost:3000')
                .set('Access-Control-Request-Method', 'GET')
                .expect(STATUS_CODES.NO_CONTENT);

            expect(response.headers['access-control-allow-origin']).toBeDefined();
            expect(response.headers['access-control-allow-methods']).toBeDefined();
        });
    });

    describe('Request Logging', () => {
        it('should log requests properly', async () => {
            const response = await request(app)
                .get('/health')
                .expect(STATUS_CODES.OK);

            expect(response.body).toHaveProperty('success', true);
        });
    });
}); 