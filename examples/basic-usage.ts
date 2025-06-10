/**
 * Basic usage example for the ABDM Node.js SDK
 * 
 * This example demonstrates how to:
 * 1. Initialize the ABDM client
 * 2. Create a new session
 * 3. Send OTP to Aadhaar linked mobile number
 * 4. Verify OTP
 */

import ABDMClient from '../src';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration
const config = {
  clientId: process.env.ABDM_CLIENT_ID,
  clientSecret: process.env.ABDM_CLIENT_SECRET,
  environment: (process.env.ABDM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

// Initialize the client
const client = new ABDMClient(config);

async function main() {
  try {
    console.log('Creating a new session...');
    const session = await client.m1.createSession();
    console.log('Session created successfully');

    // Example: Send OTP to Aadhaar linked mobile number
    const aadhaarNumber = 'XXXXXXXXXXXX'; // Replace with actual Aadhaar number
    console.log(`Sending OTP to Aadhaar number: ${aadhaarNumber}`);
    const otpResponse = await client.m1.sendAadhaarOTP(aadhaarNumber);
    console.log('OTP sent successfully. Transaction ID:', otpResponse.data?.txnId);

    // In a real application, you would prompt the user to enter the OTP
    const otp = '123456'; // Replace with actual OTP received by the user
    
    // Verify the OTP
    console.log('Verifying OTP...');
    const verifyResponse = await client.m1.verifyAadhaarOTP(otp, otpResponse.data?.txnId || '');
    console.log('OTP verified successfully. Token:', verifyResponse.data?.token);
    
    // Now you can use the token for subsequent authenticated requests
    const authToken = verifyResponse.data?.token || '';
  } catch (error) {
    console.error('An error occurred:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    process.exit(1);
  }
}

// Run the example
main();
