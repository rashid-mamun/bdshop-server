const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Cart = require('../../src/models/carts');
const User = require('../../src/models/user');
const Service = require('../../src/models/services');
const { STATUS_CODES } = require('../../src/constants/statusCodes');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('../../src/constants/messages');

const TEST_JWT_SECRET = 'test-secret-key';

describe('Cart Endpoints', () => {
    let testCart;
    let testUser;
    let testService;
    let authToken;

    beforeEach(async () => {
        await Cart.deleteMany({});
        await User.deleteMany({});
        await Service.deleteMany({});

        // Create test user
        testUser = new User({
            email: 'test@example.com',
            displayName: 'Test User',
            password: 'password123',
            district: 'Dhaka',
            division: 'Dhaka',
            role: 'user'
        });
        await testUser.save();

        // Generate JWT token for test user
        authToken = jwt.sign({ id: testUser._id, email: testUser.email, role: testUser.role }, TEST_JWT_SECRET, { expiresIn: '1h' });

        // Create test service
        testService = new Service({
            name: 'Test Service',
            model: 'Test Model',
            img: 'test-image.jpg',
            price: 1000,
            description: 'Test service description',
            config: 'Test configuration',
            category: 'electronics',
            madeIn: 'Bangladesh'
        });
        await testService.save();

        // Create test cart item (all required fields, unique id)
        testCart = new Cart({
            id: 'test-product-' + Date.now(),
            email: testUser.email,
            img: testService.img,
            description: testService.description,
            model: testService.model,
            price: testService.price,
            config: testService.config,
            quantity: 2
        });
        await testCart.save();
    });

    afterEach(async () => {
        await Cart.deleteMany({});
        await User.deleteMany({});
        await Service.deleteMany({});
    });

    describe('POST /api/carts', () => {
        it('should add item to cart successfully', async () => {
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 1
            };

            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.CREATED);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Item added to cart successfully");
            expect(response.body.data.email).toBe(cartData.email);
            expect(response.body.data.id).toBe(cartData.id);
            expect(response.body.data.quantity).toBe(cartData.quantity);
        });

        it('should update quantity if item already exists in cart', async () => {
            const fixedId = 'test-product-duplicate-12345';
            const cartData = {
                id: fixedId,
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 3
            };

            // First add
            await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.CREATED);

            // Second add (should update)
            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Cart updated successfully");
            expect(response.body.data.quantity).toBe(6); // 3 + 3 = 6 (cumulative)
        });

        it('should return 400 for missing required fields', async () => {
            const cartData = {
                email: testUser.email
                // Missing serviceId, name, price, quantity
            };

            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for invalid quantity', async () => {
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 0 // Invalid quantity
            };

            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 400 for negative price', async () => {
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: -100, // Invalid negative price
                config: testService.config,
                quantity: 1
            };

            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 401 without authentication', async () => {
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 1
            };

            const response = await request(app)
                .post('/api/carts')
                .send(cartData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/carts/:email', () => {
        it('should get user cart successfully', async () => {
            const response = await request(app)
                .get(`/api/carts/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Success");
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
            expect(response.body.data[0].email).toBe(testUser.email);
        });

        it('should return empty array for user with no cart items', async () => {
            const newUser = new User({
                email: 'newuser@example.com',
                displayName: 'New User',
                password: 'password123',
                district: 'Dhaka',
                division: 'Dhaka',
                role: 'user'
            });
            await newUser.save();

            const response = await request(app)
                .get(`/api/carts/${newUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(0);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/carts/${testUser.email}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/carts/:id', () => {
        it('should update cart item quantity successfully', async () => {
            const updateData = {
                quantity: 5
            };

            const response = await request(app)
                .put(`/api/carts/${testCart._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);
            if (response.status !== STATUS_CODES.OK) {
                console.log('Update cart item failed:', response.body);
            }
            expect(response.status).toBe(STATUS_CODES.OK);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Cart updated successfully");
            expect(response.body.data.quantity).toBe(updateData.quantity);
        });

        it('should return 400 for invalid quantity', async () => {
            const updateData = {
                quantity: 0
            };

            const response = await request(app)
                .put(`/api/carts/${testCart._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should return 404 for non-existent cart item', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const updateData = {
                quantity: 3
            };

            const response = await request(app)
                .put(`/api/carts/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.CART_NOT_FOUND);
        });

        it('should return 401 without authentication', async () => {
            const updateData = {
                quantity: 3
            };

            const response = await request(app)
                .put(`/api/carts/${testCart._id}`)
                .send(updateData)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/carts/:id', () => {
        it('should remove item from cart successfully', async () => {
            const cartToDelete = new Cart({
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 1
            });
            await cartToDelete.save();

            const response = await request(app)
                .delete(`/api/carts/${cartToDelete._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Item removed from cart successfully");
        });

        it('should return 404 for non-existent cart item', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app)
                .delete(`/api/carts/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.NOT_FOUND);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toBe(ERROR_MESSAGES.CART_NOT_FOUND);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete(`/api/carts/${testCart._id}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('DELETE /api/carts/clear/:email', () => {
        it('should clear user cart successfully', async () => {
            // Add some items to cart first
            const cartItems = [
                new Cart({
                    id: 'test-product-' + Date.now() + Math.random(),
                    email: testUser.email,
                    img: testService.img,
                    description: testService.description,
                    model: testService.model,
                    price: 1000,
                    quantity: 2
                }),
                new Cart({
                    id: 'test-product-' + Date.now() + Math.random(),
                    email: testUser.email,
                    img: testService.img,
                    description: testService.description,
                    model: testService.model,
                    price: 500,
                    quantity: 1
                })
            ];
            await Cart.insertMany(cartItems);

            const response = await request(app)
                .delete(`/api/carts/clear/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe("Cart cleared successfully");
            expect(response.body.data.deletedCount).toBeGreaterThan(0);

            // Verify cart is empty
            const getResponse = await request(app)
                .get(`/api/carts/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(getResponse.body.data).toHaveLength(0);
        });

        it('should return 0 deleted count for user with no cart items', async () => {
            const newUser = new User({
                email: 'clearcart@example.com',
                displayName: 'Clear Cart User',
                password: 'password123',
                district: 'Dhaka',
                division: 'Dhaka',
                role: 'user'
            });
            await newUser.save();

            const response = await request(app)
                .delete(`/api/carts/clear/${newUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.deletedCount).toBe(0);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .delete(`/api/carts/clear/${testUser.email}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/carts/summary/:email', () => {
        beforeEach(async () => {
            // Ensure we have cart items for testing
            await Cart.deleteMany({ email: testUser.email });

            const cartItems = [
                new Cart({
                    id: 'test-product-' + Date.now() + Math.random(),
                    email: testUser.email,
                    img: testService.img,
                    description: testService.description,
                    model: testService.model,
                    price: 1000,
                    quantity: 2
                }),
                new Cart({
                    id: 'test-product-' + Date.now() + Math.random(),
                    email: testUser.email,
                    img: testService.img,
                    description: testService.description,
                    model: testService.model,
                    price: 500,
                    quantity: 1
                })
            ];
            await Cart.insertMany(cartItems);
        });

        it('should get cart summary successfully', async () => {
            const response = await request(app)
                .get(`/api/carts/summary/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('totalItems');
            expect(response.body.data).toHaveProperty('totalPrice');
            expect(response.body.data).toHaveProperty('itemCount');

            // Verify calculations
            expect(response.body.data.totalItems).toBe(3); // 2 + 1
            expect(response.body.data.totalPrice).toBe(2500); // (1000 * 2) + (500 * 1)
            expect(response.body.data.itemCount).toBe(2); // 2 different items
        });

        it('should return zero values for user with no cart items', async () => {
            const newUser = new User({
                email: 'summary@example.com',
                displayName: 'Summary User',
                password: 'password123',
                district: 'Dhaka',
                division: 'Dhaka',
                role: 'user'
            });
            await newUser.save();

            const response = await request(app)
                .get(`/api/carts/summary/${newUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalItems).toBe(0);
            expect(response.body.data.totalPrice).toBe(0);
            expect(response.body.data.itemCount).toBe(0);
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/carts/summary/${testUser.email}`)
                .expect(STATUS_CODES.UNAUTHORIZED);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Cart Business Logic', () => {
        it('should handle duplicate items correctly', async () => {
            // Clear existing cart
            await Cart.deleteMany({ email: testUser.email });

            // Add same item multiple times
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 1
            };

            // First addition
            await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.CREATED);

            // Second addition - should update quantity
            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.OK);

            expect(response.body.data.quantity).toBe(2);

            // Verify only one cart item exists
            const cartItems = await Cart.find({ email: testUser.email });
            expect(cartItems).toHaveLength(1);
        });

        it('should calculate total price correctly with multiple items', async () => {
            // Clear existing cart
            await Cart.deleteMany({ email: testUser.email });

            // Add multiple items with different prices
            const items = [
                {
                    id: 'test-product-' + Date.now() + Math.random(),
                    email: testUser.email,
                    img: testService.img,
                    description: testService.description,
                    model: testService.model,
                    price: 1000,
                    quantity: 2
                },
                {
                    id: 'test-product-' + Date.now() + Math.random(),
                    email: testUser.email,
                    img: testService.img,
                    description: testService.description,
                    model: testService.model,
                    price: 500,
                    quantity: 3
                }
            ];

            for (const item of items) {
                await request(app)
                    .post('/api/carts')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(item);
            }

            // Get summary
            const response = await request(app)
                .get(`/api/carts/summary/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            const expectedTotal = (1000 * 2) + (500 * 3); // 2000 + 1500 = 3500
            expect(response.body.data.totalPrice).toBe(expectedTotal);
        });

        it('should handle quantity updates correctly', async () => {
            // Clear existing cart
            await Cart.deleteMany({ email: testUser.email });

            // Add item
            const cartData = {
                id: 'test-product-update-qty-12345',
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 1
            };

            const addResponse = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.CREATED);

            const cartId = addResponse.body.data._id;

            // Update quantity
            const updateResponse = await request(app)
                .put(`/api/carts/${cartId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ quantity: 5 });
            if (updateResponse.status !== STATUS_CODES.OK) {
                console.log('Update cart item (business logic) failed:', updateResponse.body);
            }
            expect(updateResponse.status).toBe(STATUS_CODES.OK);
            expect(updateResponse.body.data.quantity).toBe(5);

            // Verify total price is updated
            const summaryResponse = await request(app)
                .get(`/api/carts/summary/${testUser.email}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(STATUS_CODES.OK);

            expect(summaryResponse.body.data.totalPrice).toBe(5000); // 1000 * 5
        });
    });

    describe('Cart Validation', () => {
        it('should validate email format', async () => {
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: 'invalid-email',
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: 1
            };

            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should validate price is positive', async () => {
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: -100,
                config: testService.config,
                quantity: 1
            };

            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });

        it('should validate quantity is positive', async () => {
            const cartData = {
                id: 'test-product-' + Date.now() + Math.random(),
                email: testUser.email,
                img: testService.img,
                description: testService.description,
                model: testService.model,
                price: testService.price,
                config: testService.config,
                quantity: -1
            };

            const response = await request(app)
                .post('/api/carts')
                .set('Authorization', `Bearer ${authToken}`)
                .send(cartData)
                .expect(STATUS_CODES.BAD_REQUEST);

            expect(response.body.success).toBe(false);
        });
    });
}); 