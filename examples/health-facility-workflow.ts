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

import { ABDMClient } from '../src/abdm-client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  clientId: process.env.ABDM_CLIENT_ID,
  clientSecret: process.env.ABDM_CLIENT_SECRET,
  environment: (process.env.ABDM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

// Test data
const testData = {
  // Facility details for registration
  facility: {
    facilityId: `FAC-${uuidv4().substring(0, 8)}`,
    facilityName: 'City General Hospital',
    // Health Record Provider (HRP) details
    HRP: [
      {
        bridgeId: `BRIDGE-${uuidv4().substring(0, 8)}`,
        hipName: 'City General Hospital HIP',
        type: 'HIP' as const, // Must be one of the specified types
        active: true,
      },
    ],
  },
  // Patient ABHA address for verification
  patientAbhaAddress: 'user@abdm', // Replace with an address to test
};

// Initialize the client
const client = new ABDMClient(config);

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
    const verificationResponse = await client.m2.verifyABHAAddress(
      testData.patientAbhaAddress
    );
    if (verificationResponse.exists) {
      console.log(`✅ ABHA address '${testData.patientAbhaAddress}' exists.\n`);
    } else {
      console.log(`❌ ABHA address '${testData.patientAbhaAddress}' does not exist or is invalid.\n`);
    }

    console.log('----------------------------------------------------');
    console.log('NOTE: Further steps like consent management and fetching health records');
    console.log('require a user-specific token obtained through an interactive');
    console.log('authentication flow (e.g., OTP verification), which is not');
    console.log('demonstrated in this non-interactive example.');
    console.log('----------------------------------------------------\n');


    console.log('\n=== Health Facility Workflow Completed Successfully ===');
  } catch (error) {
    console.error('❌ Error in Health Facility Workflow:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
    } else if (error instanceof Error) {
      console.error('Error:', error.message);
    } else {
      console.error('An unknown error occurred:', error);
    }
    process.exit(1);
  }
}

// Run the health facility workflow
runHealthFacilityWorkflow();
