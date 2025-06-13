"use strict";
/**
 * Health Information Exchange Example (M3 Service)
 *
 * This example demonstrates how to use the M3 service to:
 * 1. Set up a bridge service for receiving health data
 * 2. Initiate a health information request
 * 3. Handle consent notifications
 * 4. Process and display health records
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const abdm_client_1 = require("../src/abdm-client");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const express_1 = tslib_1.__importDefault(require("express"));
const body_parser_1 = tslib_1.__importDefault(require("body-parser"));
// Load environment variables
dotenv_1.default.config();
// Configuration
const config = {
    clientId: process.env.ABDM_CLIENT_ID,
    clientSecret: process.env.ABDM_CLIENT_SECRET,
    environment: process.env.ABDM_ENVIRONMENT || 'sandbox',
    // Your server's public URL where callbacks will be received
    callbackBaseUrl: process.env.CALLBACK_BASE_URL || 'http://localhost:3000',
    // Local server port for receiving callbacks
    serverPort: parseInt(process.env.PORT || '3000', 10),
};
// Test data
const testData = {
    // Sample patient ABHA ID (replace with actual ABHA ID in production)
    patientAbhaId: 'user@abdm',
    // Your HIU (Health Information User) details
    hiu: {
        id: `HIU-${(0, uuid_1.v4)().substring(0, 8)}`,
        name: 'City Health Analytics',
        type: 'HIU',
    },
    // Sample request ID for tracking
    requestId: `REQ-${(0, uuid_1.v4)().substring(0, 8)}`,
};
// Initialize the client
const client = new abdm_client_1.ABDMClient(config);
// Store active consent requests (in-memory, use a database in production)
const activeConsentRequests = new Map();
// Create Express app for handling callbacks
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
/**
 * Start the callback server
 */
async function startCallbackServer() {
    // Health check endpoint
    app.get('/', (req, res) => {
        res.send('ABDM Callback Server is running');
    });
    // Consent notification callback
    app.post('/v0.5/consent-requests/on-init', (req, res) => {
        console.log('\n=== Received Consent Notification ===');
        console.log('Consent Request ID:', req.body.requestId);
        console.log('Status:', req.body.status);
        console.log('Consent ID:', req.body.consentId);
        console.log('==============================\n');
        // Store the consent ID for later use
        if (req.body.consentId && activeConsentRequests.has(req.body.requestId)) {
            const consentRequest = activeConsentRequests.get(req.body.requestId);
            consentRequest.consentId = req.body.consentId;
            consentRequest.status = req.body.status;
        }
        res.json({
            requestId: (0, uuid_1.v4)(),
            timestamp: new Date().toISOString(),
            ack: true,
        });
    });
    // Health information callback
    app.post('/v0.5/health-information/notify', (req, res) => {
        console.log('\n=== Received Health Information ===');
        console.log('Request ID:', req.body.requestId);
        console.log('Status:', req.body.status);
        if (req.body.entry) {
            console.log(`Received ${req.body.entry.length} health records`);
            if (req.body.entry.length > 0) {
                console.log('Sample record:', JSON.stringify(req.body.entry[0], null, 2));
            }
        }
        console.log('==============================\n');
        res.json({
            requestId: (0, uuid_1.v4)(),
            timestamp: new Date().toISOString(),
            ack: true,
        });
    });
    // Start the server
    return new Promise((resolve) => {
        app.listen(config.serverPort, () => {
            console.log(`Callback server running at ${config.callbackBaseUrl}`);
            resolve();
        });
    });
}
/**
 * Main workflow for health information exchange
 */
async function runHealthInformationExchange() {
    console.log('=== Starting Health Information Exchange Workflow ===\n');
    // Start the callback server
    await startCallbackServer();
    try {
        // 1. Authenticate with ABDM
        console.log('1. Authenticating with ABDM...');
        await client.authenticate();
        console.log('✅ Authentication successful!\n');
        // 2. Register Callback URLs (one-time setup)
        console.log('2. Registering callback URLs...');
        await client.m3.updateBridgeUrl({
            bridgeId: testData.hiu.id,
            callbackUrl: `${config.callbackBaseUrl}/v0.5`,
        });
        console.log('✅ Callback URLs registered successfully!\n');
        // 3. Initiate Consent Request
        console.log('3. Initiating consent request...');
        const consentRequest = await client.m3.initiateConsentRequest({
            requestId: testData.requestId,
            abhaId: testData.patientAbhaId,
            purpose: 'TREATMENT',
            hiTypes: ['OPConsultation', 'DiagnosticReport', 'Prescription'],
            dateFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
            dateTo: new Date(),
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            hiu: {
                id: testData.hiu.id,
                name: testData.hiu.name,
                type: testData.hiu.type,
            },
        });
        // Store the consent request for reference
        activeConsentRequests.set(testData.requestId, {
            ...consentRequest,
            status: 'REQUESTED',
        });
        console.log('✅ Consent request initiated!');
        console.log(`Consent Request ID: ${consentRequest.requestId}`);
        console.log('Please approve the consent request in your ABHA app...\n');
        // 4. Wait for consent approval (in a real app, this would be event-driven)
        console.log('4. Waiting for consent approval (checking every 10 seconds)...');
        let consentGranted = false;
        let consentId = null;
        for (let i = 0; i < 12; i++) { // Wait up to 2 minutes
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
            const consentStatus = activeConsentRequests.get(testData.requestId);
            if (consentStatus?.status === 'GRANTED') {
                console.log('✅ Consent granted!');
                consentGranted = true;
                consentId = consentStatus.consentId;
                break;
            }
            else if (consentStatus?.status === 'DENIED') {
                console.log('❌ Consent denied by user');
                return;
            }
            console.log('Still waiting for consent approval...');
        }
        if (!consentGranted || !consentId) {
            console.log('Timed out waiting for consent approval');
            return;
        }
        // 5. Request Health Information
        console.log('\n5. Requesting health information...');
        const healthInfoRequest = await client.m3.requestHealthInformation({
            requestId: `REQ-${(0, uuid_1.v4)().substring(0, 8)}`,
            consentId: consentId,
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            dateTo: new Date(),
            hiu: {
                id: testData.hiu.id,
                name: testData.hiu.name,
                type: testData.hiu.type,
            },
        });
        console.log('✅ Health information request submitted!');
        console.log(`Request ID: ${healthInfoRequest.requestId}`);
        console.log('Waiting for health records...\n');
        // In a real application, the health records would be delivered asynchronously
        // to the callback URL we registered earlier
        // For demo purposes, we'll keep the server running for a while
        console.log('The server will continue running to receive callbacks.');
        console.log('Press Ctrl+C to stop the server when done.');
    }
    catch (error) {
        console.error('❌ Error in Health Information Exchange Workflow:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
        else if (error.request) {
            console.error('No response received:', error.request);
        }
        else {
            console.error('Error:', error.message);
        }
        throw error;
    }
}
// Run the health information exchange workflow
runHealthInformationExchange()
    .catch(error => {
    console.error('Health Information Exchange Workflow failed:', error);
    process.exit(1);
});
//# sourceMappingURL=health-information-exchange.js.map