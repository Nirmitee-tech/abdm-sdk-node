import { ABDMClient } from '@nirmitee/abdm-sdk-node';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Initialize configuration
const clientId = process.env.NEXT_PUBLIC_ABHA_CLIENT_ID || process.env.ABHA_CLIENT_ID;
const clientSecret = process.env.NEXT_PUBLIC_ABHA_CLIENT_SECRET || process.env.ABHA_CLIENT_SECRET;
const gatewayUrl = process.env.NEXT_PUBLIC_ABHA_GATEWAY_URL || process.env.ABHA_GATEWAY_URL || 'https://dev.abdm.gov.in/gateway';
const baseUrl = process.env.NEXT_PUBLIC_ABHA_BASE_URL || process.env.ABHA_BASE_URL || 'https://abhasbx.abdm.gov.in/abha';
const xcmId = process.env.NEXT_PUBLIC_ABHA_XCM_ID || process.env.ABHA_XCM_ID || 'sbx';

console.log('Initializing ABDM client with configuration:');
console.log('- Gateway URL:', gatewayUrl);
console.log('- Base URL:', baseUrl);
console.log('- X-CM-ID:', xcmId);
console.log('- Client ID:', clientId ? '***' + clientId.slice(-4) : 'Not provided');
console.log('- Client Secret:', clientSecret ? '***' + clientSecret.slice(-4) : 'Not provided');

// Validate required configuration
if (!clientId || !clientSecret) {
  console.error('\nError: Missing required configuration. Please set ABHA_CLIENT_ID and ABHA_CLIENT_SECRET in your environment variables.');
  process.exit(1);
}

// Initialize the ABDM client
const client = new ABDMClient({
  clientId,
  clientSecret,
  xcmId,
  basePath: gatewayUrl,
  baseUrl,
  useSandbox: true,
  debug: true,
  timeout: 30000,
});

// Example Aadhaar number (replace with actual Aadhaar number in production)
const AADHAAR_NUMBER = '123456789012';

async function main() {
  try {
    console.log('\n=== Starting Aadhaar OTP Request ===');
    
    // Send OTP to Aadhaar
    console.log(`\nSending OTP to Aadhaar number: ${AADHAAR_NUMBER}`);
    
    const response = await client.m1.sendAadhaarOTP({
      aadhaar: AADHAAR_NUMBER,
      purpose: 'KYC_AND_LINK',
      txnId: `TXN${Date.now()}`
    });

    console.log('\n=== OTP Sent Successfully ===');
    console.log('Transaction ID:', response.txnId);
    console.log('Status:', response.status);
    console.log('Message:', response.message);
    
  } catch (error) {
    console.error('\n=== Error ===');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\nAuthentication failed. Please check:');
        console.error('1. Your client ID and secret are correct');
        console.error('2. Your IP is whitelisted in the ABDM sandbox');
        console.error('3. Your credentials are properly registered in the ABDM sandbox');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Run the example
main().catch(console.error);