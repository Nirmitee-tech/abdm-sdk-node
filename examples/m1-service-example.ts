/**
 * M1 Service Non-Interactive Example
 *
 * This example demonstrates how to use the M1 service for non-interactive tasks:
 * 1. Get a client session (access token).
 * 2. Retrieve the public key for data encryption.
 *
 * NOTE: This example does not cover interactive workflows like Aadhaar OTP generation
 * or ABHA ID creation, as these require user interaction and encryption of sensitive data
 * (Aadhaar number, OTP), which is beyond the scope of this simple demonstration.
 */

import { ABDMClient } from '../src/abdm-client';
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Ensure client ID and secret are configured
if (!process.env.ABDM_CLIENT_ID || !process.env.ABDM_CLIENT_SECRET) {
  console.error('Error: ABDM_CLIENT_ID and ABDM_CLIENT_SECRET must be set in the .env file.');
  process.exit(1);
}

// Configuration
const config = {
  clientId: process.env.ABDM_CLIENT_ID,
  clientSecret: process.env.ABDM_CLIENT_SECRET,
  environment: (process.env.ABDM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

// Initialize the client
const client = new ABDMClient(config);

async function runM1ServiceExample() {
  console.log('=== Starting M1 Service Non-Interactive Example ===\n');

  try {
    // 1. Get a session token for the client
    console.log('1. Getting a client session (access token)...');
    const sessionResponse = await client.m1.getSession({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      grantType: 'client_credentials',
    });
    const accessToken = sessionResponse.data?.accessToken;
    if (!accessToken) {
      throw new Error('Failed to obtain access token.');
    }
    console.log('✅ Session created successfully!');
    console.log(`Access Token: ${accessToken.substring(0, 15)}...\n`);

    // 2. Get the public key for encryption
    // In a real application, this key would be used to encrypt sensitive data (like Aadhaar number or OTP)
    // before sending it to the ABDM APIs.
    console.log('2. Retrieving the public key for data encryption...');
    const publicKeyResponse = await client.m1.getPublicKey();
    const publicKey = publicKeyResponse.data?.key;
    if (!publicKey) {
      throw new Error('Failed to retrieve public key.');
    }
    console.log('✅ Public key retrieved successfully!');
    console.log(`Public Key: ${publicKey.substring(0, 30)}...\n`);

    console.log('----------------------------------------------------');
    console.log('NOTE: The methods for Aadhaar OTP and ABHA ID creation');
    console.log('(sendAadhaarOTP, createAbhaIdByAadhaar) require');
    console.log('encrypted payloads and are part of an interactive user flow.');
    console.log('They are not demonstrated in this non-interactive example.');
    console.log('----------------------------------------------------\n');

    console.log('\n=== M1 Service Example Completed Successfully ===');
  } catch (error) {
    console.error('❌ Error in M1 Service Example:');
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

// Run the M1 service example
runM1ServiceExample();
