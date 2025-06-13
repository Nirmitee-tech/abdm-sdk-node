"use strict";
/**
 * M2 Service Health Facility Management Example
 *
 * This example demonstrates how to use the M2 service for non-interactive
 * health facility management tasks:
 * 1. Authenticate the client.
 * 2. Add or update a health facility's services.
 * 3. Retrieve details for a specific health facility.
 * 4. List all registered health facilities.
 *
 * NOTE: This workflow does not cover user-centric operations like profile updates,
 * consent management, or fetching health records, which require an interactive
 * user authentication flow to obtain a user-specific token.
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
// Test data for health facility
const testFacility = {
    facilityId: `FAC-${(0, uuid_1.v4)().substring(0, 8)}`,
    facilityName: 'Sunrise Clinic',
    HRP: [
        {
            bridgeId: `BRIDGE-${(0, uuid_1.v4)().substring(0, 8)}`,
            hipName: 'Sunrise Clinic HIP',
            type: 'HIP',
            active: true,
        },
    ],
};
// Initialize the client
const client = new abdm_client_1.ABDMClient(config);
async function runM2FacilityExample() {
    console.log('=== Starting M2 Health Facility Management Example ===\n');
    try {
        // 1. Authenticate the client
        console.log('1. Authenticating client...');
        await client.authenticate();
        console.log('✅ Client authenticated successfully!\n');
        // 2. Add/Update Health Facility Services
        console.log('2. Adding/Updating health facility services...');
        const facilityResponse = await client.m2.addUpdateHealthFacilityServices(testFacility);
        if (!facilityResponse?.facilityId) {
            throw new Error('Failed to add or update health facility services.');
        }
        console.log('✅ Health facility services updated successfully!');
        console.log(`Facility ID: ${facilityResponse.facilityId}\n`);
        // 3. Get Health Facility Details
        console.log(`3. Getting details for facility: ${facilityResponse.facilityId}...`);
        const facilityDetails = await client.m2.getHealthFacility(facilityResponse.facilityId);
        if (!facilityDetails) {
            throw new Error(`Failed to retrieve details for facility: ${facilityResponse.facilityId}`);
        }
        console.log('✅ Facility details retrieved successfully!');
        console.log(`Facility Name: ${facilityDetails.facilityName}`);
        console.log(`HRPs: ${JSON.stringify(facilityDetails.HRP, null, 2)}\n`);
        // 4. List All Health Facilities
        console.log('4. Listing all registered health facilities...');
        const allFacilities = await client.m2.listHealthFacilities();
        if (!allFacilities) {
            throw new Error('Failed to list health facilities.');
        }
        console.log(`✅ Found ${allFacilities.length} health facilities.`);
        if (allFacilities.length > 0 && allFacilities[0]) {
            console.log(`First facility in list: ${allFacilities[0].facilityName} (${allFacilities[0].facilityId})`);
        }
        console.log('\n');
        console.log('----------------------------------------------------');
        console.log('NOTE: Operations like profile updates, consent management, and fetching');
        console.log('health records require a user-specific token from an interactive flow.');
        console.log('----------------------------------------------------\n');
        console.log('\n=== M2 Health Facility Management Example Completed Successfully ===');
    }
    catch (error) {
        console.error('❌ Error in M2 Facility Example:');
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
// Run the M2 facility management example
runM2FacilityExample();
//# sourceMappingURL=m2-service-example.js.map