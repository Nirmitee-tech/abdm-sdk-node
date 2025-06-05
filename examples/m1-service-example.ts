/**
 * M1 Service Example
 * 
 * This example demonstrates how to use the M1 service to:
 * 1. Create a session
 * 2. Send and verify Aadhaar OTP
 * 3. Create ABHA with Aadhaar
 * 4. Manage ABHA address and mobile updates
 */

import ABDMClient from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  clientId: process.env.ABDM_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.ABDM_CLIENT_SECRET || 'your-client-secret',
  environment: (process.env.ABDM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

// Initialize the client
const client = new ABDMClient(config);

async function runM1Examples() {
  try {
    // 1. Create a session
    console.log('1. Creating a new session...');
    const session = await client.m1.createSession();
    console.log('✅ Session created successfully');
    console.log('Session ID:', session.data?.sessionId);
    console.log('---');

    // 2. Send OTP to Aadhaar linked mobile number
    const aadhaarNumber = 'XXXXXXXXXXXX'; // Replace with actual Aadhaar
    console.log(`2. Sending OTP to Aadhaar number: ${aadhaarNumber}...`);
    const otpResponse = await client.m1.sendAadhaarOTP(
      aadhaarNumber,
      'AADHAAR_VERIFICATION'
    );
    console.log('✅ OTP sent successfully');
    console.log('Transaction ID:', otpResponse.data?.txnId);
    console.log('---');

    // In a real app, you would get this from user input
    const otp = '123456'; // Replace with actual OTP
    
    // 3. Verify Aadhaar OTP
    console.log('3. Verifying OTP...');
    const verifyResponse = await client.m1.verifyAadhaarOTP(
      otp,
      otpResponse.data?.txnId || ''
    );
    console.log('✅ OTP verified successfully');
    const authToken = verifyResponse.data?.token;
    console.log('Auth Token:', authToken?.substring(0, 20) + '...');
    console.log('---');

    // 4. Create ABHA with Aadhaar
    console.log('4. Creating ABHA with Aadhaar...');
    const abhaData = {
      txnId: verifyResponse.data?.txnId || '',
      name: 'John Doe',
      gender: 'M',
      yearOfBirth: '1990',
      monthOfBirth: '01',
      dayOfBirth: '01',
      address: {
        line: '123 Main St',
        district: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
      },
      email: 'john.doe@example.com',
    };

    const abhaResponse = await client.m1.createABHAWithAadhaar(abhaData);
    console.log('✅ ABHA created successfully');
    const healthId = abhaResponse.data?.healthId;
    console.log('Health ID:', healthId);
    console.log('---');

    // 5. Create or update ABHA address
    console.log('5. Creating/Updating ABHA address...');
    const abhaAddress = 'john.doe@abdm';
    const addressResponse = await client.m1.createOrUpdateABHAAddress(
      abhaAddress,
      true, // preferred
      authToken || ''
    );
    console.log('✅ ABHA address updated:', addressResponse.data?.message);
    console.log('---');

    // 6. Update mobile number
    console.log('6. Updating mobile number...');
    const mobile = '9876543210';
    const mobileOtpResponse = await client.m1.sendMobileUpdateOTP(mobile, authToken || '');
    console.log('✅ OTP sent to new mobile number');
    
    // Verify mobile OTP
    const mobileOTP = '654321'; // In real app, get from user
    const verifyMobileResponse = await client.m1.verifyMobileUpdateOTP(
      mobileOTP,
      mobileOtpResponse.data?.txnId || '',
      authToken || ''
    );
    console.log('✅ Mobile number updated successfully');
    console.log('---');

    console.log('🎉 M1 Service Examples Completed Successfully!');
  } catch (error: any) {
    console.error('❌ Error in M1 Example:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the examples
runM1Examples();
