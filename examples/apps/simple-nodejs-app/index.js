import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Set log level to debug before importing the SDK
process.env.LOG_LEVEL = 'debug';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
const envPath = resolve(__dirname, '.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
  console.error('Error loading .env file:', envResult.error);
  process.exit(1);
}

// Import the SDK after setting environment variables
const { ABDMClient } = await import('@nirmitee/abdm-sdk-node');
import { logger } from '@nirmitee/abdm-sdk-node/dist/utils/logger.js';

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

/**
 * Test the connection to ABDM services
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function testConnection() {
  try {
    logger.info('Testing connection to ABDM services...');
    
    // This will automatically authenticate if needed
    logger.info('Fetching public key from ABDM...');
    const publicKeyResponse = await client.m1.getPublicKey();
    
    logger.info('Successfully connected to ABDM services!');
    logger.debug('Public Key: %s', publicKeyResponse.data.key ? '*** (key received)' : 'undefined');
    
    // Get the current auth token
    const authToken = client.getAuthToken();
    logger.info('Authentication successful!');
    logger.debug('Auth Token: %s', authToken ? '*** (token received)' : 'undefined');
    
    return { success: true };
  } catch (error) {
    logger.error('Error in testConnection:');
    
    // Log detailed error information if available
    if (error.response) {
      logger.error('Error Status: %s', error.response.status);
      logger.error('Error Data: %j', error.response.data);
      logger.error('Error Headers: %j', error.response.headers);
    } else if (error.request) {
      logger.error('No response received from server');
      logger.error('Request: %j', {
        method: error.config?.method,
        url: error.config?.url,
        headers: {
          ...error.config?.headers,
          'Authorization': '***',
          'X-Token': '***',
        },
      });
    } else {
      logger.error('Error Message: %s', error.message);
    }
    
    return { 
      success: false, 
      error: error.message || 'Unknown error occurred during connection test' 
    };
  }
}

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
