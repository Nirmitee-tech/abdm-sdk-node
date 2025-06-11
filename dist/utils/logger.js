"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const pino_1 = tslib_1.__importDefault(require("pino"));
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
// Create a logger instance
const logger = (0, pino_1.default)({
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
                    destination: path_1.default.join(logDir, 'abdm-sdk.log'),
                    mkdir: true,
                },
            },
        ],
    },
});
exports.logger = logger;
exports.default = logger;
//# sourceMappingURL=logger.js.map