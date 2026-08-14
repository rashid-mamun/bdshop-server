const request = require('supertest');
const mongoose = require('mongoose');
const appModule = require('../../src/app');
const app = appModule.default || appModule;
const userModule = require('../../src/models/user');
const User = userModule.default || userModule.User || userModule;
const { STATUS_CODES } = require('../../src/constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../src/constants/messages');
const jwt = require('jsonwebtoken');
const TEST_JWT_SECRET = 'test-secret-key';
const TEST_JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key';
const { VALIDATION_MESSAGES } = require('../../src/constants/messages');

describe('User Endpoints', () => {
    let testUser;
    let adminUser;
    let authToken;
    let adminToken;

    beforeEach(async () => {
        await User.deleteMany({});

        // Create test users
        testUser = new User({
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'password123',
            phone: '+8801000000001',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'user',
        });
        await testUser.save();

        adminUser = new User({
            email: 'admin@example.com',
            displayName: 'Admin User',
            password: 'password123',
            phone: '+8801000000002',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'admin',
        });
        await adminUser.save();

        authToken = jwt.sign({ email: testUser.email, role: testUser.role }, TEST_JWT_SECRET);
        adminToken = jwt.sign({ email: adminUser.email, role: adminUser.role }, TEST_JWT_SECRET);
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/users/register', () => {
        it('should create a new user successfully', async () => {
            const userData = {
                email: 'newuser@example.com',
                displayName: 'New User',
                password: 'password123',
                phone: '+8801000000003',
                district: 'Chittagong',
                division: 'Chittagong',
                role: 'user',
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USER_CREATED);
            expect(response.body.data.email).toBe(userData.email);
            expect(response.body.data.displayName).toBe(userData.displayName);
            expect(response.body.data).not.toHaveProperty('password');
        });

        it('should return 400 for invalid email format', async () => {
            const userData = {
                email: 'invalid-email',
                displayName: 'Test User',
                password: 'password123',
                phone: '+8801000000004',
                district: 'Dhaka',
                division: 'Dhaka',
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(VALIDATION_MESSAGES.EMAIL_INVALID);
        });

        it('should return 400 for missing required fields', async () => {
            const userData = {
                email: 'test@example.com',
                displayName: 'Test User',
                // Missing password, district, division
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for duplicate email', async () => {
            const userData = {
                email: 'TEST@EXAMPLE.COM', // Same normalized email already exists
                displayName: 'Another User',
                password: 'password123',
                phone: '+8801000000005',
                district: 'Dhaka',
                division: 'Dhaka',
            };

            const response = await request(app)
                .post('/api/users/register')
                .send(userData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/:email', () => {
        it('should get user by email successfully', async () => {
            const response = await request(app)
                .get(`/api/users/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USER_FETCHED);
            expect(response.body.data.user.email).toBe(testUser.email);
            expect(response.body.data.user.displayName).toBe(testUser.displayName);
            expect(response.body.data.admin).toBe(false);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .get('/api/users/nonexistent@example.com')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.USER_NOT_FOUND);
        });

        it('should return admin status correctly', async () => {
            const response = await request(app)
                .get(`/api/users/${adminUser.email}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.admin).toBe(true);
        });
    });

    describe('POST /api/users/login', () => {
        it('should login successfully with valid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({ email: testUser.email, password: 'password123' })
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data.email).toBe(testUser.email);
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should return 401 for invalid credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({ email: testUser.email, password: 'wrong-password' })
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid credentials');
        });

        it('should return 400 for missing credentials', async () => {
            const response = await request(app)
                .post('/api/users/login')
                .send({ email: testUser.email })
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/users/logout', () => {
        it('should clear auth cookies', async () => {
            const response = await request(app).post('/api/users/logout').expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            const cookies = response.headers['set-cookie'] || [];
            const cookieString = cookies.join(';');
            expect(cookieString).toContain('accessToken=');
            expect(cookieString).toContain('refreshToken=');
        });
    });

    describe('POST /api/users/refresh', () => {
        it('should refresh tokens with valid refresh token cookie', async () => {
            const refreshToken = jwt.sign(
                { id: testUser._id, email: testUser.email, role: testUser.role },
                TEST_JWT_REFRESH_SECRET,
                { expiresIn: '1h' },
            );

            const response = await request(app)
                .post('/api/users/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token refreshed successfully');
            expect(response.headers['set-cookie']).toBeDefined();
        });

        it('should return 401 for missing refresh token', async () => {
            const response = await request(app)
                .post('/api/users/refresh')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Refresh token missing');
        });

        it('should return 401 for invalid refresh token', async () => {
            const response = await request(app)
                .post('/api/users/refresh')
                .set('Cookie', ['refreshToken=invalid-token'])
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Invalid refresh token');
        });
    });

    describe('GET /api/users', () => {
        it('should get all users with pagination', async () => {
            const response = await request(app)
                .get('/api/users?page=1&limit=10')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USERS_FETCHED);
            expect(response.body.data).toHaveProperty('users');
            expect(response.body.data).toHaveProperty('pagination');
            expect(Array.isArray(response.body.data.users)).toBe(true);
        });

        it('should filter users by role', async () => {
            const response = await request(app)
                .get('/api/users?role=admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.every((user) => user.role === 'admin')).toBe(true);
        });

        it('should filter users by division', async () => {
            const response = await request(app)
                .get('/api/users?division=Dhaka')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.users.every((user) => user.division === 'Dhaka')).toBe(true);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app).get('/api/users').expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users', () => {
        it('should update user successfully', async () => {
            const updateData = {
                email: testUser.email,
                displayName: 'Updated User Name',
                district: 'Updated District',
            };

            const response = await request(app)
                .put('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USER_UPDATED);
            expect(response.body.data.displayName).toBe(updateData.displayName);
        });

        it('should return 400 for invalid email in update', async () => {
            const updateData = {
                email: 'invalid-email',
                displayName: 'Updated Name',
            };

            const response = await request(app)
                .put('/api/users')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .put('/api/users')
                .send({ email: testUser.email, displayName: 'Test' })
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/admin', () => {
        it('should make user admin successfully', async () => {
            const response = await request(app)
                .put('/api/users/admin')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ email: testUser.email })
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USER_ADMIN_UPDATED);
            expect(response.body.data.role).toBe('admin');
        });

        it('should return 401 without admin authentication', async () => {
            const response = await request(app)
                .put('/api/users/admin')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ email: testUser.email })
                .expect(STATUS_CODES.FORBIDDEN);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .put('/api/users/admin')
                .send({ email: testUser.email })
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/users/:email', () => {
        it('should delete user successfully', async () => {
            const userToDelete = new User({
                email: 'delete@example.com',
                displayName: 'Delete User',
                password: 'password123',
                district: 'Dhaka',
                division: 'Dhaka',
            });
            await userToDelete.save();

            const response = await request(app)
                .delete(`/api/users/${userToDelete.email}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USER_DELETED);
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app)
                .delete('/api/users/nonexistent@example.com')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without admin authentication', async () => {
            const response = await request(app)
                .delete(`/api/users/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.FORBIDDEN);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/profile/me', () => {
        it('should get current user profile', async () => {
            const response = await request(app)
                .get('/api/users/profile/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USER_FETCHED);
            expect(response.body.data.email).toBe(testUser.email);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get('/api/users/profile/me')
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/profile/me', () => {
        it('should update current user profile', async () => {
            const updateData = {
                displayName: 'Updated Profile Name',
                district: 'Updated District',
            };

            const response = await request(app)
                .put('/api/users/profile/me')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(SUCCESS_MESSAGES.USER_UPDATED);
            expect(response.body.data.displayName).toBe(updateData.displayName);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .put('/api/users/profile/me')
                .send({ displayName: 'Test' })
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/change-password', () => {
        it('should change password successfully', async () => {
            const response = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ currentPassword: 'password123', newPassword: 'newpass123' })
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Password changed successfully');
        });

        it('should reject same new password as current', async () => {
            const response = await request(app)
                .put('/api/users/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ currentPassword: 'password123', newPassword: 'password123' })
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('New password cannot be the same as current password');
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .put('/api/users/change-password')
                .send({ currentPassword: 'password123', newPassword: 'newpass123' })
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/:email/deactivate', () => {
        it('should deactivate user successfully', async () => {
            const userToDeactivate = new User({
                email: 'deactivate@example.com',
                displayName: 'Deactivate User',
                password: 'password123',
                district: 'Dhaka',
                division: 'Dhaka',
            });
            await userToDeactivate.save();

            const response = await request(app)
                .put(`/api/users/${userToDeactivate.email}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(false);
        });

        it('should reject admin self-deactivation', async () => {
            const response = await request(app)
                .put(`/api/users/${adminUser.email}/deactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe('Admins cannot deactivate their own account');
        });

        it('should return 401 without admin authentication', async () => {
            const response = await request(app)
                .put(`/api/users/${testUser.email}/deactivate`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.FORBIDDEN);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/users/:email/reactivate', () => {
        it('should reactivate user successfully', async () => {
            const userToReactivate = new User({
                email: 'reactivate@example.com',
                displayName: 'Reactivate User',
                password: 'password123',
                district: 'Dhaka',
                division: 'Dhaka',
                isActive: false,
            });
            await userToReactivate.save();

            const response = await request(app)
                .put(`/api/users/${userToReactivate.email}/reactivate`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.isActive).toBe(true);
        });

        it('should return 401 without admin authentication', async () => {
            const response = await request(app)
                .put(`/api/users/${testUser.email}/reactivate`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.FORBIDDEN);

            expect(response.body.success).toBe(false);
        });
    });
});
