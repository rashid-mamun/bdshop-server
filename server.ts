import app from './src/app';
import { connectDatabase } from './src/config/database';
import { logger } from './src/utils/logger';
import { cleanupExpiredPendingUploads, startUploadCleanupJob } from './src/services/uploadAssetService';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDatabase();
        await cleanupExpiredPendingUploads();

        // Start server
        const uploadCleanupInterval = startUploadCleanupJob();
        const server = app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            clearInterval(uploadCleanupInterval);
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            clearInterval(uploadCleanupInterval);
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });
    } catch (error: Error | unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Failed to start server:', error);
        console.error('❌ Failed to start server:', errorMessage);
        process.exit(1);
    }
};

startServer();
