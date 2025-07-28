# Testing Documentation

This directory contains comprehensive integration tests for the BdShop Server API. The tests are designed to verify all endpoints, authentication, validation, and business logic.

## Test Structure

```
tests/
├── integration/           # Integration tests for all endpoints
│   ├── health.test.js     # Health check and server status tests
│   ├── users.test.js      # User management endpoint tests
│   ├── services.test.js   # Service management endpoint tests
│   ├── orders.test.js     # Order management endpoint tests
│   ├── carts.test.js      # Shopping cart endpoint tests
│   ├── reviews.test.js    # Review system endpoint tests
│   └── public.test.js     # Public endpoint tests
├── unit/                  # Unit tests (to be implemented)
├── e2e/                   # End-to-end tests (to be implemented)
├── fixtures/              # Test data fixtures
├── setup.js              # Test setup and configuration
├── run-all-tests.js      # Comprehensive test runner
└── README.md             # This file
```

## Test Coverage

### Integration Tests

#### 1. Health Tests (`health.test.js`)
- ✅ Server health status
- ✅ Root endpoint functionality
- ✅ CORS headers
- ✅ Error handling
- ✅ Request logging
- ✅ Security headers

#### 2. User Tests (`users.test.js`)
- ✅ User creation
- ✅ User retrieval by email
- ✅ User listing with pagination
- ✅ User updates
- ✅ User deletion
- ✅ Admin role management
- ✅ User activation/deactivation
- ✅ Profile management
- ✅ Authentication and authorization
- ✅ Input validation

#### 3. Service Tests (`services.test.js`)
- ✅ Service creation (admin only)
- ✅ Service listing with pagination
- ✅ Service retrieval by ID
- ✅ Service updates (admin only)
- ✅ Service deletion (admin only)
- ✅ Category filtering
- ✅ Price range filtering
- ✅ Search functionality
- ✅ Service statistics
- ✅ Authentication and authorization

#### 4. Order Tests (`orders.test.js`)
- ✅ Order creation
- ✅ Order listing with pagination
- ✅ Order retrieval by ID
- ✅ Order status updates
- ✅ Order statistics
- ✅ Order validation
- ✅ Status transitions
- ✅ Authentication and authorization

#### 5. Cart Tests (`carts.test.js`)
- ✅ Add items to cart
- ✅ Retrieve user cart
- ✅ Update cart item quantities
- ✅ Remove items from cart
- ✅ Clear user cart
- ✅ Cart summary calculations
- ✅ Duplicate item handling
- ✅ Business logic validation
- ✅ Authentication required

#### 6. Review Tests (`reviews.test.js`)
- ✅ Review creation
- ✅ Review listing with pagination
- ✅ Review retrieval by ID
- ✅ Review updates
- ✅ Review deletion
- ✅ Review statistics
- ✅ Duplicate review prevention
- ✅ Rating validation
- ✅ Authentication required

#### 7. Public Tests (`public.test.js`)
- ✅ Public service access
- ✅ Public review access
- ✅ CORS handling
- ✅ Rate limiting
- ✅ Security headers
- ✅ Compression
- ✅ Error handling
- ✅ API versioning

## Running Tests

### Prerequisites

1. **Database Setup**: Ensure you have a test database configured
   ```bash
   # Set test database environment variable
   export MONGODB_URI_TEST=mongodb://localhost:27017/bdshop_test
   ```

2. **Environment Variables**: Create a `.env.test` file for test-specific configuration
   ```env
   NODE_ENV=test
   MONGODB_URI_TEST=mongodb://localhost:27017/bdshop_test
   JWT_SECRET=test-secret-key
   ```

### Test Commands

#### Run All Tests
```bash
# Run all integration tests with comprehensive reporting
npm run test:integration:all

# Run all tests (unit + integration)
npm test
```

#### Run Specific Test Suites
```bash
# Health checks
npm run test:integration:health

# User endpoints
npm run test:integration:users

# Service endpoints
npm run test:integration:services

# Order endpoints
npm run test:integration:orders

# Cart endpoints
npm run test:integration:carts

# Review endpoints
npm run test:integration:reviews

# Public endpoints
npm run test:integration:public
```

#### Development Commands
```bash
# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage

# Run tests with verbose output
npx jest --verbose
```

### Test Runner Features

The `run-all-tests.js` script provides:

- ✅ **Sequential Execution**: Tests run one after another to avoid conflicts
- ✅ **Comprehensive Reporting**: Detailed pass/fail status for each test file
- ✅ **Color-coded Output**: Easy-to-read console output with colors
- ✅ **Duration Tracking**: Total execution time measurement
- ✅ **Error Details**: Detailed error information for failed tests
- ✅ **Summary Report**: Final summary with statistics

## Test Configuration

### Jest Configuration

The Jest configuration is defined in `package.json`:

```json
{
  "jest": {
    "testEnvironment": "node",
    "testTimeout": 15000,
    "collectCoverageFrom": [
      "**/*.js",
      "!node_modules/**",
      "!tests/**",
      "!coverage/**"
    ],
    "coverageReporters": [
      "text",
      "lcov",
      "html"
    ],
    "setupFilesAfterEnv": [
      "<rootDir>/tests/setup.js"
    ],
    "testMatch": [
      "**/tests/**/*.test.js"
    ]
  }
}
```

### Test Setup (`setup.js`)

The test setup file handles:
- Database connection for tests
- Test environment configuration
- Global test utilities
- Cleanup procedures

## Test Data Management

### Database Cleanup

Each test suite includes proper database cleanup:

```javascript
beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI_TEST);
    
    // Clear test data
    await User.deleteMany({});
    await Service.deleteMany({});
    // ... other collections
});

afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await Service.deleteMany({});
    await mongoose.connection.close();
});
```

### Test Data Creation

Tests create their own test data to ensure isolation:

```javascript
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
```

## Authentication Testing

### JWT Token Management

Tests that require authentication create and use JWT tokens:

```javascript
// Create auth token for testing
const authToken = jwt.sign(
    { id: testUser._id, email: testUser.email, role: testUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);

// Use token in requests
const response = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${authToken}`)
    .expect(STATUS_CODES.OK);
```

### Role-based Testing

Tests verify different user roles and permissions:

```javascript
// Test admin-only endpoints
it('should return 401 without admin authentication', async () => {
    const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${userToken}`) // Regular user token
        .expect(STATUS_CODES.FORBIDDEN);
});
```

## Validation Testing

### Input Validation

Tests verify that endpoints properly validate input:

```javascript
it('should return 400 for invalid email format', async () => {
    const userData = {
        email: 'invalid-email',
        displayName: 'Test User',
        password: 'password123',
        district: 'Dhaka',
        division: 'Dhaka'
    };

    const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(STATUS_CODES.BAD_REQUEST);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(ERROR_MESSAGES.EMAIL_INVALID);
});
```

### Business Logic Validation

Tests verify business rules and constraints:

```javascript
it('should prevent duplicate reviews from same user', async () => {
    // Create first review
    await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(STATUS_CODES.CREATED);

    // Try to create duplicate review
    const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(STATUS_CODES.BAD_REQUEST);

    expect(response.body.error).toContain('already reviewed');
});
```

## Error Handling Testing

### HTTP Status Codes

Tests verify correct HTTP status codes:

```javascript
it('should return 404 for non-existent resource', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const response = await request(app)
        .get(`/api/services/${fakeId}`)
        .expect(STATUS_CODES.NOT_FOUND);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe(ERROR_MESSAGES.SERVICE_NOT_FOUND);
});
```

### Error Messages

Tests verify consistent error message format:

```javascript
expect(response.body).toMatchObject({
    success: false,
    error: expect.any(String),
    timestamp: expect.any(String)
});
```

## Performance Testing

### Rate Limiting

Tests verify rate limiting functionality:

```javascript
it('should apply rate limiting to endpoints', async () => {
    const promises = Array(150).fill().map(() =>
        request(app).get('/health')
    );

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
});
```

## Continuous Integration

### CI/CD Integration

The test suite is designed to work with CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run test:integration:all
    npm run test:coverage
```

### Exit Codes

Tests use proper exit codes for CI integration:
- `0`: All tests passed
- `1`: Tests failed or errors occurred

## Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to group related tests
2. **Clear Test Names**: Use descriptive test names that explain the expected behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
4. **Isolation**: Each test should be independent and not rely on other tests

### Test Data

1. **Fresh Data**: Create fresh test data for each test
2. **Cleanup**: Always clean up test data after tests
3. **Realistic Data**: Use realistic but minimal test data
4. **Edge Cases**: Test edge cases and boundary conditions

### Assertions

1. **Specific Assertions**: Use specific assertions rather than generic ones
2. **Error Messages**: Test both success and error scenarios
3. **Response Structure**: Verify response structure and content
4. **Status Codes**: Always verify HTTP status codes

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure test database is running and accessible
2. **Environment Variables**: Verify all required environment variables are set
3. **Port Conflicts**: Ensure test server doesn't conflict with development server
4. **Timeout Issues**: Increase Jest timeout for slow tests

### Debug Mode

Run tests in debug mode for more information:

```bash
# Verbose output
npx jest --verbose

# Debug specific test
npx jest --verbose tests/integration/users.test.js

# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Contributing

When adding new tests:

1. Follow the existing test structure and naming conventions
2. Include both positive and negative test cases
3. Test edge cases and error conditions
4. Ensure proper cleanup in `afterAll` hooks
5. Update this documentation if adding new test categories

## Coverage Goals

- **Line Coverage**: > 90%
- **Branch Coverage**: > 85%
- **Function Coverage**: > 95%

Run coverage report to check current status:

```bash
npm run test:coverage
``` 