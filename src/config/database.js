const mongoose = require('mongoose');
require('dotenv').config();

const { logger } = require('../utils/logger');

const getDatabaseUri = () => {
    return process.env.MONGODB_URI ||
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2tqgh.mongodb.net/BdShopDb?retryWrites=true&w=majority`;
};

const getDatabaseOptions = () => {
    return {
        useNewUrlParser: true,
        useUnifiedTopology: true,
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

const connectDatabase = async () => {
    try {
        const uri = getDatabaseUri();
        const options = getDatabaseOptions();

        await mongoose.connect(uri, options);
        setupConnectionEvents();

        logger.info('Database Connected Successfully');

    } catch (error) {
        logger.error('Database connection failed:', error.message);
        process.exit(1);
    }
};

const disconnectDatabase = async () => {
    try {
        await mongoose.connection.close();
        logger.info('Database disconnected gracefully');
    } catch (error) {
        logger.error('Error disconnecting database:', error.message);
    }
};

const getConnection = () => {
    return mongoose.connection;
};

const isConnected = () => {
    return mongoose.connection.readyState === 1;
};

module.exports = {
    connectDatabase,
    disconnectDatabase,
    getConnection,
    isConnected
}; 