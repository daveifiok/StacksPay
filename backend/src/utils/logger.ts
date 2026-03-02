import winston from 'winston';
import config from '@/config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      service,
      message,
      ...meta
    });
  })
);

// Create a single shared logger instance to prevent duplicate handlers
let sharedLogger: winston.Logger | null = null;

const createLogger = (service: string = 'sBTC-Gateway') => {
  // Return existing logger with updated service name if it exists
  if (sharedLogger) {
    return sharedLogger.child({ service });
  }

  sharedLogger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
          winston.format.printf(({ level, message, service, timestamp }) => {
            return `${timestamp} [${service}] ${level}: ${message}`;
          })
        )
      }),
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    ],
    // Remove exception and rejection handlers to prevent conflicts with our custom handlers
    // exceptionHandlers: [
    //   new winston.transports.File({ filename: 'logs/exceptions.log' })
    // ],
    // rejectionHandlers: [
    //   new winston.transports.File({ filename: 'logs/rejections.log' })
    // ]
  });

  return sharedLogger.child({ service });
};

export { createLogger };
export default createLogger();