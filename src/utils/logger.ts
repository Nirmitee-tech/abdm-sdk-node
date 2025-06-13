import fs from 'fs';
import path from 'path';

import type { Logger } from 'pino';
import pino from 'pino';

// Define log levels type
type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Safely get log level from environment
const getLogLevel = (): LogLevel => {
  const level = process.env['LOG_LEVEL']?.toLowerCase() as LogLevel | undefined;
  const validLevels: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

  if (level && validLevels.includes(level)) {
    return level;
  }
  return 'info';
};

const logLevel = getLogLevel();

// Create a simple console logger with pretty print for development
const logger: Logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      levelFirst: true,
      singleLine: true,
      sync: true,
    },
  },
});

// Also log to file in production
if (process.env['NODE_ENV'] === 'production') {
  // Log to file in production
  const fileTransport = pino.transport({
    target: 'pino/file',
    options: {
      destination: path.join(logDir, 'abdm-sdk.log'),
      mkdir: true,
    },
  });
  
  // Log file path for reference
  logger.info('Logging to file:', path.join(logDir, 'abdm-sdk.log'));
  
  // Use the file transport
  logger.info = fileTransport.info.bind(fileTransport);
  logger.error = fileTransport.error.bind(fileTransport);
  logger.warn = fileTransport.warn.bind(fileTransport);
  logger.debug = fileTransport.debug.bind(fileTransport);
}

// Enable debug logging if LOG_LEVEL is set to debug
if (logLevel === 'debug') {
  logger.debug('Debug logging enabled');
}

export { logger };

export default logger;
