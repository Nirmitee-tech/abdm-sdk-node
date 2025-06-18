"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pino_1 = __importDefault(require("pino"));
// Create logs directory if it doesn't exist
const logDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
// Safely get log level from environment
const getLogLevel = () => {
    const level = process.env['LOG_LEVEL']?.toLowerCase();
    const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
    if (level && validLevels.includes(level)) {
        return level;
    }
    return 'info';
};
const logLevel = getLogLevel();
// Create a simple console logger with pretty print for development
const logger = (0, pino_1.default)({
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
exports.logger = logger;
// Also log to file in production
if (process.env['NODE_ENV'] === 'production') {
    // Log to file in production
    const fileTransport = pino_1.default.transport({
        target: 'pino/file',
        options: {
            destination: path_1.default.join(logDir, 'abdm-sdk.log'),
            mkdir: true,
        },
    });
    // Log file path for reference
    logger.info('Logging to file:', path_1.default.join(logDir, 'abdm-sdk.log'));
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
exports.default = logger;
//# sourceMappingURL=logger.js.map