"use strict";
/**
 * Health Facility Management and ABHA Verification Workflow Example
 *
 * This example demonstrates how to use the M2 service to:
 * 1. Register and manage a health facility.
 * 2. Verify if an ABHA address exists.
 *
 * NOTE: This workflow focuses on facility-level and non-interactive operations.
 * Operations requiring patient consent and access to health records (e.g., creating consents,
 * fetching records) necessitate a separate user authentication flow (e.g., via OTP)
 * to obtain a user-specific access token. Such interactive flows are not covered in this example.
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
// Test data
const testData = {
    // Facility details for registration
    facility: {
        facilityId: `FAC-${(0, uuid_1.v4)().substring(0, 8)}`,
        facilityName: 'City General Hospital',
        // Health Record Provider (HRP) details
        HRP: [
            {
                bridgeId: `BRIDGE-${(0, uuid_1.v4)().substring(0, 8)}`,
                hipName: 'City General Hospital HIP',
                type: 'HIP', // Must be one of the specified types
                active: true,
            },
        ],
    },
    // Patient ABHA address for verification
    patientAbhaAddress: 'user@abdm', // Replace with an address to test
};
// Initialize the client
const client = new abdm_client_1.ABDMClient(config);
async function runHealthFacilityWorkflow() {
    console.log('=== Starting Health Facility Workflow ===\n');
    try {
        // 1. Authenticate the client with ABDM
        console.log('1. Authenticating client with ABDM...');
        await client.authenticate();
        console.log('✅ Client authentication successful!\n');
        // 2. Register/Update Health Facility
        console.log('2. Registering/Updating health facility...');
        const facilityResponse = await client.m2.addUpdateHealthFacilityServices({
            facilityId: testData.facility.facilityId,
            facilityName: testData.facility.facilityName,
            HRP: testData.facility.HRP,
        });
        if (!facilityResponse?.facilityId) {
            throw new Error('Failed to register or update health facility.');
        }
        console.log('✅ Health facility registered/updated successfully!');
        console.log(`Facility ID: ${facilityResponse.facilityId}\n`);
        // 3. Verify an ABHA Address
        // This is a non-interactive check to see if an ABHA address is valid and exists.
        console.log(`3. Verifying ABHA address: ${testData.patientAbhaAddress}...`);
        const verificationResponse = await client.m2.verifyABHAAddress(testData.patientAbhaAddress);
        if (verificationResponse.exists) {
            console.log(`✅ ABHA address '${testData.patientAbhaAddress}' exists.\n`);
        }
        else {
            console.log(`❌ ABHA address '${testData.patientAbhaAddress}' does not exist or is invalid.\n`);
        }
        console.log('----------------------------------------------------');
        console.log('NOTE: Further steps like consent management and fetching health records');
        console.log('require a user-specific token obtained through an interactive');
        console.log('authentication flow (e.g., OTP verification), which is not');
        console.log('demonstrated in this non-interactive example.');
        console.log('----------------------------------------------------\n');
        console.log('\n=== Health Facility Workflow Completed Successfully ===');
    }
    catch (error) {
        console.error('❌ Error in Health Facility Workflow:');
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
// Run the health facility workflow
runHealthFacilityWorkflow();
//# sourceMappingURL=health-facility-workflow.js.map