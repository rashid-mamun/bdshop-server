const app = require('./src/app');
const { connectDatabase } = require('./src/config/database');
const { logger } = require('./src/utils/logger');

// Single Responsibility: Start the server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();

        // Start server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// Start the server
startServer(); 