"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const src_1 = require("../src");
const logger_1 = require("../src/utils/logger");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
async function runLoggingExample() {
    // Initialize the client with your credentials
    const client = new src_1.ABDMClient({
        clientId: process.env.ABDM_CLIENT_ID || '',
        clientSecret: process.env.ABDM_CLIENT_SECRET || '',
        basePath: process.env.ABDM_BASE_URL || 'https://dev.abdm.gov.in/gateway',
        useSandbox: process.env.ABDM_USE_SANDBOX !== 'false',
    });
    try {
        logger_1.logger.info('Starting ABDM client example');
        // Authenticate with ABDM (this will log the authentication request/response)
        await client.authenticate();
        // Example: Get public key (this will log the API call)
        logger_1.logger.info('Fetching ABDM public key');
        const publicKeyResponse = await client.m1.getPublicKey();
        if (!publicKeyResponse.success || !publicKeyResponse.data) {
            logger_1.logger.error('Failed to retrieve public key', {
                status: publicKeyResponse.status,
                error: publicKeyResponse.error
            });
            return;
        }
        const publicKey = publicKeyResponse.data.key;
        logger_1.logger.info('Public key retrieved successfully', {
            hasKey: !!publicKey,
            keyLength: publicKey?.length || 0,
            status: publicKeyResponse.status
        });
        // Example of a debug log with structured data
        if (publicKey) {
            logger_1.logger.debug('Public key details', {
                keyPrefix: publicKey.substring(0, 10) + '...' + publicKey.slice(-10),
                status: publicKeyResponse.status,
                statusText: publicKeyResponse.statusText
            });
        }
    }
    catch (error) {
        // Log the full error with stack trace in development
        if (process.env.NODE_ENV === 'development') {
            logger_1.logger.error('Error in ABDM client example:', error);
        }
        else {
            // In production, log a more concise error message
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            logger_1.logger.error(`ABDM client error: ${errorMessage}`, {
                code: error?.code,
                status: error?.response?.status,
            });
        }
        process.exit(1);
    }
}
// Run the example
runLoggingExample();
//# sourceMappingURL=logging-example.js.map