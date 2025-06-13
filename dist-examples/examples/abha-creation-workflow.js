"use strict";
/**
 * ABHA Creation Workflow Example
 *
 * This example demonstrates a complete ABHA (Ayushman Bharat Health Account) creation workflow:
 * 1. Initialize the ABDM client
 * 2. Generate and verify Aadhaar OTP
 * 3. Create ABHA using Aadhaar
 * 4. Generate and verify mobile OTP
 * 5. Create ABHA address
 * 6. Fetch ABHA profile
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAbhaCreationWorkflow = runAbhaCreationWorkflow;
const tslib_1 = require("tslib");
const src_1 = require("../src");
const uuid_1 = require("uuid");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const axios_1 = tslib_1.__importDefault(require("axios"));
// Load environment variables
dotenv_1.default.config();
// Configuration
const config = {
    clientId: process.env.ABDM_CLIENT_ID,
    clientSecret: process.env.ABDM_CLIENT_SECRET,
    environment: process.env.ABDM_ENVIRONMENT || 'sandbox',
};
// Test data (replace with actual values in production)
const testData = {
    // Test Aadhaar number (sandbox environment)
    aadhaarNumber: '999999990019',
    // Test mobile number (sandbox environment)
    mobileNumber: '9999999999',
    // Test OTP (sandbox environment)
    otp: '123456',
    // Desired ABHA address
    abhaAddress: `user${Math.floor(Math.random() * 10000)}@abdm`,
};
// Initialize the client
const client = new src_1.ABDMClient(config);
async function runAbhaCreationWorkflow() {
    console.log('🚀 Starting ABHA Creation Workflow...\n');
    console.log('Test Data:', testData);
    console.log('----------------------------------------\n');
    try {
        // 1. Authenticate with ABDM
        console.log('1. Authenticating with ABDM...');
        await client.authenticate();
        console.log('✅ Authentication successful!\n');
        // 2. Generate Aadhaar OTP
        console.log('2. Generating Aadhaar OTP...');
        const otpTxnId = (0, uuid_1.v4)();
        const aadhaarOtpResponse = await client.m1.sendAadhaarOTP({
            loginId: testData.aadhaarNumber, // Note: As per docs, this should be encrypted.
            loginHint: 'aadhaar',
            scope: ['abha-enrol'],
            otpSystem: 'aadhaar',
            txnId: otpTxnId,
        });
        if (!aadhaarOtpResponse.data?.txnId) {
            throw new Error('Failed to get transaction ID for Aadhaar OTP.');
        }
        const aadhaarOtpTxnId = aadhaarOtpResponse.data.txnId;
        console.log('✅ Aadhaar OTP generated successfully!');
        console.log(`Transaction ID: ${aadhaarOtpTxnId}\n`);
        // 3. Create ABHA ID by verifying Aadhaar OTP
        console.log('3. Creating ABHA ID by verifying Aadhaar OTP...');
        const createAbhaTxnId = (0, uuid_1.v4)();
        const abhaCreationResponse = await client.m1.createAbhaIdByAadhaar({
            txnId: createAbhaTxnId,
            authData: {
                authMethods: ['otp'],
                otp: {
                    otpValue: testData.otp, // Note: As per docs, this should be encrypted.
                    txnId: aadhaarOtpTxnId,
                },
            },
            consent: {
                code: 'abha-enrol', // Example consent code
                version: '1.0.0', // Example consent version
            },
        });
        console.log('✅ ABHA ID created successfully!');
        console.log('ABHA creation response:', JSON.stringify(abhaCreationResponse.data, null, 2), '\n');
        console.log('🎉 ABHA Creation Workflow Completed Successfully! 🎉');
        if (abhaCreationResponse.data?.phrAddress) {
            console.log('Your new ABHA Address is:', abhaCreationResponse.data.phrAddress);
        }
    }
    catch (error) {
        console.error('❌ Error in ABHA Creation Workflow:');
        if (axios_1.default.isAxiosError(error)) {
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
            else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
            }
            else {
                // Something happened in setting up the request
                console.error('Error:', error.message);
            }
        }
        else if (error instanceof Error) {
            console.error('Error:', error.message);
        }
        else {
            console.error('An unknown error occurred:', error);
        }
        throw error;
    }
}
// Run the ABHA creation workflow
runAbhaCreationWorkflow()
    .catch(error => {
    console.error('ABHA Creation Workflow failed:', error);
    process.exit(1);
});
//# sourceMappingURL=abha-creation-workflow.js.map