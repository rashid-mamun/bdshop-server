const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

// Import configurations and middleware
const environment = require('./config/environment');
const logger = require('./config/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { defaultRateLimiter } = require('./middleware/rateLimiter');
const { SUCCESS_MESSAGES } = require('./constants/messages');
const { STATUS_CODES } = require('./constants/statusCodes');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
    origin: environment.CORS_ORIGIN,
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', { stream: logger.stream }));

// Rate limiting
app.use(defaultRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.SERVER_HEALTHY,
        timestamp: new Date().toISOString(),
        environment: environment.NODE_ENV,
        version: environment.API_VERSION
    });
});
// 405 for unsupported methods on /health
app.all('/health', (req, res) => {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.SERVER_RUNNING,
        version: environment.API_VERSION,
        endpoints: [
            '/api/users',
            '/api/services',
            '/api/orders',
            '/api/carts',
            '/api/reviews'
        ],
        documentation: '/docs'
    });
});

// API routes with versioning
app.use(`${environment.API_PREFIX}/users`, require('./routes/userRoutes'));
app.use(`${environment.API_PREFIX}/services`, require('./routes/serviceRoutes'));
app.use(`${environment.API_PREFIX}/orders`, require('./routes/orderRoutes'));
app.use(`${environment.API_PREFIX}/carts`, require('./routes/cartRoutes'));
app.use(`${environment.API_PREFIX}/reviews`, require('./routes/reviewRoutes'));
app.use('/', require('./routes/publicRoutes'));

// Error handling middleware
app.use(notFoundHandler);
const { methodNotAllowedHandler } = require('./middleware/errorHandler');
app.use(methodNotAllowedHandler);
app.use(errorHandler);

module.exports = app; 