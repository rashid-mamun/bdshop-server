import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import environment from './config/environment';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler, methodNotAllowedHandler } from './middleware/errorHandler';
import { SUCCESS_MESSAGES } from './constants/messages';
import { STATUS_CODES } from './constants/statusCodes';

import userRoutes from './routes/userRoutes';
import serviceRoutes from './routes/serviceRoutes';
import orderRoutes from './routes/orderRoutes';
import cartRoutes from './routes/cartRoutes';
import reviewRoutes from './routes/reviewRoutes';
import publicRoutes from './routes/publicRoutes';
import uploadRoutes from './routes/uploadRoutes';
import authRoutes from './routes/authRoutes';
import addressRoutes from './routes/addressRoutes';

const app = express();

app.use(helmet());

app.use(compression());

app.use(
    cors({
        origin: environment.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }),
);

app.get('/health', (req, res) => {
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.SERVER_HEALTHY,
        timestamp: new Date().toISOString(),
        environment: environment.NODE_ENV,
        version: environment.API_VERSION,
    });
});
app.all('/health', (req, res) => {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
});

app.get('/', (req, res) => {
    res.status(STATUS_CODES.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.SERVER_RUNNING,
        version: environment.API_VERSION,
        endpoints: ['/api/users', '/api/services', '/api/orders', '/api/carts', '/api/reviews'],
        documentation: '/docs',
    });
});

app.use(`${environment.API_PREFIX}/users`, userRoutes);
app.use(`${environment.API_PREFIX}/services`, serviceRoutes);
app.use(`${environment.API_PREFIX}/orders`, orderRoutes);
app.use(`${environment.API_PREFIX}/carts`, cartRoutes);
app.use(`${environment.API_PREFIX}/reviews`, reviewRoutes);
app.use(`${environment.API_PREFIX}/upload`, uploadRoutes);
app.use(`${environment.API_PREFIX}/auth`, authRoutes);
app.use(`${environment.API_PREFIX}/addresses`, addressRoutes);
app.use('/', publicRoutes);

app.use(notFoundHandler);
app.use(methodNotAllowedHandler);
app.use(errorHandler);

export default app;
