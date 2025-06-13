"use strict";
/**
 * M3 Service Setup Example
 *
 * This example demonstrates the non-interactive setup steps for the M3 service (HIU):
 * 1. Create a client session to obtain an access token.
 * 2. Register a bridge service, which acts as an endpoint for ABDM callbacks.
 *
 * NOTE: This example does not cover the interactive HIU workflows such as consent
 * requests or health information fetching. These are complex, asynchronous processes
 * that require a backend server to handle callbacks from the ABDM gateway and are
 * initiated by user actions in a real application.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const abdm_client_1 = require("../src/abdm-client");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const axios_1 = tslib_1.__importDefault(require("axios"));
// Load environment variables
dotenv_1.default.config();
// Configuration
const config = {
    clientId: process.env.ABDM_CLIENT_ID,
    clientSecret: process.env.ABDM_CLIENT_SECRET,
    environment: process.env.ABDM_ENVIRONMENT || 'sandbox',
};
// Initialize the client
const client = new abdm_client_1.ABDMClient(config);
async function runM3SetupExample() {
    console.log('=== Starting M3 Service Setup Example ===\n');
    try {
        // 1. Create a session to get an access token
        console.log('1. Creating a client session...');
        const session = await client.m3.createSession(config.clientId, config.clientSecret);
        if (!session?.accessToken) {
            throw new Error('Failed to create a session or obtain an access token.');
        }
        const authToken = session.accessToken;
        console.log('✅ Session created successfully!');
        console.log(`Access Token: ${authToken.substring(0, 20)}...\n`);
        // 2. Register a Bridge Service (HIU)
        // This is a one-time setup step to register your service with ABDM.
        // The endpoint specified here is where ABDM will send callbacks.
        console.log('2. Registering a new bridge service (HIU)...');
        const serviceData = {
            id: `HIU-${(0, uuid_1.v4)().substring(0, 8)}`,
            name: 'My Health Information User Service',
            types: ['HIU'],
            endpoints: {
                hiuEndpoints: [
                    {
                        use: 'data-push',
                        connectionType: 'HTTPS',
                        address: 'https://my-hiu-service.com/api/v1/data-push',
                    },
                ],
            },
            active: true,
        };
        const serviceResponse = await client.m3.registerBridgeService(serviceData, authToken);
        if (!serviceResponse?.id) {
            throw new Error('Failed to register bridge service.');
        }
        console.log('✅ Service registered successfully!');
        console.log(`Service ID: ${serviceResponse.id}`);
        console.log(`Service Name: ${serviceResponse.name}\n`);
        console.log('----------------------------------------------------');
        console.log('NOTE: The core M3 (HIU) workflow is interactive and asynchronous.');
        console.log('It involves initiating a consent request, waiting for user approval');
        console.log('via a callback to your server, and then fetching health information.');
        console.log('This cannot be demonstrated in a simple, non-interactive script.');
        console.log('----------------------------------------------------\n');
        console.log('\n=== M3 Service Setup Example Completed Successfully ===');
    }
    catch (error) {
        console.error('❌ Error in M3 Setup Example:');
        if (axios_1.default.isAxiosError(error)) {
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
        }
        else if (error instanceof Error) {
            console.error('Error:', error.message);
        }
        else {
            console.error('An unknown error occurred:', error);
        }
        process.exit(1);
    }
}
// Run the M3 setup example
runM3SetupExample();
//# sourceMappingURL=m3-service-example.js.map