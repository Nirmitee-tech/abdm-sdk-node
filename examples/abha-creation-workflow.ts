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

import { ABDMClient } from '../src/abdm-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  clientId: process.env.ABDM_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.ABDM_CLIENT_SECRET || 'your-client-secret',
  environment: (process.env.ABDM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
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
const client = new ABDMClient(config);

async function runAbhaCreationWorkflow() {
  console.log('=== Starting ABHA Creation Workflow ===\n');

  try {
    // 1. Authenticate with ABDM
    console.log('1. Authenticating with ABDM...');
    await client.authenticate();
    console.log('✅ Authentication successful!\n');

    // 2. Generate Aadhaar OTP
    console.log('2. Generating Aadhaar OTP...');
    const aadhaarOtpResponse = await client.m1.generateAadhaarOtp({
      aadhaar: testData.aadhaarNumber,
    });
    console.log('✅ Aadhaar OTP generated successfully!');
    console.log(`Transaction ID: ${aadhaarOtpResponse.txnId}\n`);

    // 3. Verify Aadhaar OTP
    console.log('3. Verifying Aadhaar OTP...');
    const aadhaarVerifyResponse = await client.m1.verifyAadhaarOtp({
      otp: testData.otp,
      txnId: aadhaarOtpResponse.txnId,
    });
    console.log('✅ Aadhaar OTP verified successfully!');
    console.log(`Aadhaar Token: ${aadhaarVerifyResponse.token}\n`);

    // 4. Create ABHA using Aadhaar
    console.log('4. Creating ABHA using Aadhaar...');
    const abhaCreateResponse = await client.m1.createAbhaWithAadhaar({
      aadhaarToken: aadhaarVerifyResponse.token,
      txnId: aadhaarOtpResponse.txnId,
      consent: true,
      consentVersion: '1.0',
    });
    console.log('✅ ABHA created successfully!');
    console.log(`Health ID: ${abhaCreateResponse.healthId}`);
    console.log(`Health ID Number: ${abhaCreateResponse.healthIdNumber}\n`);

    // 5. Generate Mobile OTP
    console.log('5. Generating Mobile OTP...');
    const mobileOtpResponse = await client.m1.generateMobileOtp({
      mobile: testData.mobileNumber,
    });
    console.log('✅ Mobile OTP sent successfully!');
    console.log(`Transaction ID: ${mobileOtpResponse.txnId}\n`);

    // 6. Verify Mobile OTP
    console.log('6. Verifying Mobile OTP...');
    await client.m1.verifyMobileOtp({
      otp: testData.otp,
      txnId: mobileOtpResponse.txnId,
    });
    console.log('✅ Mobile number verified and linked successfully!\n');

    // 7. Create ABHA Address
    console.log('7. Creating ABHA Address...');
    const abhaAddressResponse = await client.m1.createAbhaAddress({
      address: testData.abhaAddress,
      isDefault: true,
    });
    console.log('✅ ABHA Address created successfully!');
    console.log(`ABHA Address: ${abhaAddressResponse.abhaAddress}\n`);

    // 8. Get ABHA Profile
    console.log('8. Fetching ABHA Profile...');
    const profile = await client.m1.getAbhaProfile();
    console.log('✅ ABHA Profile fetched successfully!');
    console.log('Profile:', JSON.stringify(profile, null, 2));

    console.log('\n=== ABHA Creation Workflow Completed Successfully ===');
    console.log('✅ Your ABHA has been created successfully!');
    console.log(`📱 ABHA Address: ${abhaAddressResponse.abhaAddress}`);
    console.log(`🔢 Health ID: ${abhaCreateResponse.healthIdNumber}`);

  } catch (error) {
    console.error('❌ Error in ABHA Creation Workflow:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
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
