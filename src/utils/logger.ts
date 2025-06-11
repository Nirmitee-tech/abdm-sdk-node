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
  const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  const validLevels: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

  if (level && validLevels.includes(level)) {
    return level;
  }
  return 'info';
};

const logLevel = getLogLevel();

// Create a logger instance
const logger: Logger = pino({
  level: logLevel,
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: logLevel,
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
      {
        target: 'pino/file',
        level: 'trace', // Log everything to file
        options: {
          destination: path.join(logDir, 'abdm-sdk.log'),
          mkdir: true,
        },
      },
    ],
  },
});

export { logger };

export default logger;
