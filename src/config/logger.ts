import winston from 'winston';
import environment from './environment';

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const { service, ...rest } = meta;
        const metaStr = Object.keys(rest).length
            ? `\n  ${JSON.stringify(rest, null, 2).replace(/\n/g, '\n  ')}`
            : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}${stackStr}`;
    }),
);

const jsonFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
);

const logger = winston.createLogger({
    level: environment.LOG_LEVEL ?? (environment.NODE_ENV === 'production' ? 'warn' : 'debug'),
    format: jsonFormat,
    defaultMeta: { service: 'bdshop-server' },
    transports: [
        new winston.transports.Console({
            format: environment.NODE_ENV !== 'production' ? consoleFormat : jsonFormat,
        }),
    ],
});

const morganStream = {
    write(message: string) {
        logger.http(message.trim());
    },
};

(logger as any).stream = morganStream;

export default logger;
