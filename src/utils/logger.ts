import { createLogger, transports, format } from 'winston';
import path from 'path';
import fs from 'fs';

export const logsFolder = './logs/';

const ensureLogsDirectory = () => {
    if (!fs.existsSync(logsFolder)) {
        fs.mkdirSync(logsFolder, { recursive: true });
    }
};

const createCustomFormat = () => {
    return format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.json(),
    );
};

const createFileTransports = () => {
    return [
        new transports.File({
            filename: path.join(logsFolder, 'logs.log'),
            level: 'info',
            maxsize: 5242880,
            maxFiles: 5,
        }),
        new transports.File({
            filename: path.join(logsFolder, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5,
        }),
    ];
};

const createConsoleTransport = () => {
    return new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
    });
};

const createLoggerInstance = () => {
    ensureLogsDirectory();

    return createLogger({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: createCustomFormat(),
        transports: [
            ...createFileTransports(),
            ...(process.env.NODE_ENV !== 'production' ? [createConsoleTransport()] : []),
        ],
        exitOnError: false,
    });
};

const createRequestLogger = () => {
    ensureLogsDirectory();

    return createLogger({
        level: 'info',
        format: createCustomFormat(),
        transports: [
            new transports.File({
                filename: path.join(logsFolder, 'requestInfo.log'),
                level: 'info',
                maxsize: 5242880,
                maxFiles: 5,
            }),
            new transports.File({
                filename: path.join(logsFolder, 'requestErrors.log'),
                level: 'error',
                maxsize: 5242880,
                maxFiles: 5,
            }),
            new transports.File({
                filename: path.join(logsFolder, 'requestWarnings.log'),
                level: 'warn',
                maxsize: 5242880,
                maxFiles: 5,
            }),
        ],
        exitOnError: false,
    });
};

export const logger = createLoggerInstance();
export const requestLogger = createRequestLogger();
