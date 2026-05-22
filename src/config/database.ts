import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import environment from './environment';
import { logger } from '../utils/logger';
import {
    getErrorMessage,
    getErrorName,
    getErrorCode,
    getErrorProperty,
} from '../utils/errorHandler';

dotenv.config();

let mongoMemoryServer: MongoMemoryServer | null = null;

const getDatabaseUri = (): string => {
    return environment.MONGODB_URI;
};

const getDatabaseOptions = (): ConnectOptions => {
    return {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
    };
};

const setupConnectionEvents = () => {
    mongoose.connection.on('error', (error) => {
        logger.error('Database connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('Database disconnected');
    });

    mongoose.connection.on('reconnected', () => {
        logger.info('Database reconnected');
    });
};

const connectWithMemoryServer = async () => {
    mongoMemoryServer = await MongoMemoryServer.create();
    const memoryUri = mongoMemoryServer.getUri('bdshop');

    logger.warn('Falling back to in-memory MongoDB');
    await mongoose.connect(memoryUri, getDatabaseOptions());
    setupConnectionEvents();
    logger.info('Connected to in-memory MongoDB');
};

export const connectDatabase = async () => {
    try {
        mongoose.set('strictQuery', false);

        const uri = getDatabaseUri();
        const options = getDatabaseOptions();

        await mongoose.connect(uri, options);
        setupConnectionEvents();

        logger.info('Database Connected Successfully');
    } catch (error: Error | unknown) {
        logger.error(
            `Database connection failed for ${getDatabaseUri()}: ${getErrorMessage(error)}`,
        );

        if (environment.NODE_ENV === 'test' || environment.MONGODB_MEMORY_FALLBACK) {
            await connectWithMemoryServer();
            return;
        }

        throw error;
    }
};

export const disconnectDatabase = async () => {
    try {
        await mongoose.connection.close();

        if (mongoMemoryServer) {
            await mongoMemoryServer.stop();
            mongoMemoryServer = null;
        }

        logger.info('Database disconnected gracefully');
    } catch (error: Error | unknown) {
        logger.error('Error disconnecting database:', getErrorMessage(error));
    }
};

export const getConnection = () => {
    return mongoose.connection;
};

export const isConnected = () => {
    return mongoose.connection.readyState === 1;
};
