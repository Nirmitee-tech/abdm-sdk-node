const dotenv = require('dotenv');
const { fileURLToPath } = require('url');
const { dirname, resolve } = require('path');

// Set log level to debug before importing the SDK
process.env.LOG_LEVEL = 'debug';

// Load environment variables from .env file
const envPath = resolve(__dirname, '.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error('Error loading .env file:', envResult.error);
  process.exit(1);
}

// Import the SDK after setting environment variables
const { ABDMClient } = require('@nirmitee/abdm-sdk-node');
const logger = require('@nirmitee/abdm-sdk-node/utils/logger').logger;

// Log environment information
logger.info('Environment variables loaded from: %s', envPath);
logger.info('NODE_ENV: %s', process.env.NODE_ENV || 'development');
logger.info('LOG_LEVEL: %s', process.env.LOG_LEVEL || 'info');
logger.info('ABHA_CLIENT_ID: %s', process.env.ABHA_CLIENT_ID ? '***' : 'undefined');
logger.info('ABHA_CLIENT_SECRET: %s', process.env.ABHA_CLIENT_SECRET ? '*** (set)' : 'undefined');
logger.debug('ABHA_BASE_URL: %s', process.env.ABHA_BASE_URL || 'not set');
logger.debug('ABHA_GATEWAY_URL: %s', process.env.ABHA_GATEWAY_URL || 'not set');
logger.debug('ABHA_X_CM_ID: %s', process.env.ABHA_X_CM_ID || 'not set');

// Log the configuration that will be used to create the client
const clientConfig = {
  clientId: process.env.ABHA_CLIENT_ID || 'undefined',
  clientSecret: process.env.ABHA_CLIENT_SECRET ? '*** (set)' : 'undefined',
  baseURL: process.env.ABHA_BASE_URL || 'not set',
  gatewayURL: process.env.ABHA_GATEWAY_URL || 'not set',
  useSandbox: process.env.NODE_ENV !== 'production',
  xcmId: process.env.ABHA_X_CM_ID || 'sbx (default)',
};

logger.info('Creating ABDM client with configuration:', {
  ...clientConfig,
  // Redact sensitive information in logs
  clientId: clientConfig.clientId ? '*** (set)' : 'undefined',
  clientSecret: '*** (set)',
});

// Create the client with configuration from environment variables
const client = new ABDMClient({
  clientId: process.env.ABHA_CLIENT_ID,
  clientSecret: process.env.ABHA_CLIENT_SECRET,
  baseURL: process.env.ABHA_BASE_URL,
  gatewayURL: process.env.ABHA_GATEWAY_URL,
  // Use sandbox mode if we're not explicitly in production
  useSandbox: process.env.NODE_ENV !== 'production',
  // Set X-CM-ID from environment or use default 'sbx' for sandbox
  xcmId: process.env.ABHA_X_CM_ID || 'sbx',
  // Explicitly set authBaseURL to use the gateway URL for authentication
  authBaseURL: process.env.ABHA_GATEWAY_URL || 'https://dev.abdm.gov.in/gateway',
});


// Main function to run the example
async function main() {
  try {

    const authToken = await client.authenticate();
    // Test the connection and authentication
    const result = await testConnection();
    
    if (!result.success) {
      logger.error('Connection test failed');
      process.exit(1);
    }
    
    logger.info('Connection test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Unhandled error in main:', error);
    process.exit(1);
  }
}

// Run the example
main();
