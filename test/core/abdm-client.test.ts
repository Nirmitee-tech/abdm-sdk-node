import { ABDMClient } from '../../src/core/abdm-client';
import dotenv from 'dotenv';
import path from 'path';
import readlineSync from 'readline-sync';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Test configuration - using real credentials from environment variables
const config = {
  clientId: process.env.ABDM_CLIENT_ID!,
  clientSecret: process.env.ABDM_CLIENT_SECRET!,
  useSandbox: true, // Set to false for production
};

describe('ABDM Authentication Test', () => {
  // Skip tests if required environment variables are not set
  if (!config.clientId || !config.clientSecret) {
    console.warn('Skipping test: ABDM_CLIENT_ID and ABDM_CLIENT_SECRET environment variables are required');
    return;
  }

  let client: ABDMClient;

  beforeEach(() => {
    // Create a new instance of ABDMClient with real configuration
    client = new ABDMClient(config);
  });

  it('should authenticate and return a valid access token', async () => {
    // Log the authentication attempt
    console.log('Attempting to authenticate with ABDM API...');
    console.log(`Using client ID: ${config.clientId.substring(0, 5)}...`);
    
    try {
      // Act - Call authenticate which should store the token internally
      await client.authenticate();
      
      // Get the stored token from the http client
      const token = (client as any).http.getAuthToken();
      
      // Log token info (without exposing the full token)
      console.log('Authentication successful');
      console.log(`Token type: ${typeof token}`);
      console.log(`Token length: ${token?.length || 0} characters`);
      
      // Assert - Verify we got a non-empty string token
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      
      // Verify the token is in JWT format (3 parts separated by dots)
      const tokenParts = token.split('.');
      expect(tokenParts).toHaveLength(3);
      
      // Log the JWT parts (header and payload only, not the signature)
      try {
        const [header, payload] = tokenParts;
        const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        
        console.log('Token Header:', JSON.stringify(decodedHeader, null, 2));
        console.log('Token Payload:', JSON.stringify({
          ...decodedPayload,
          // Mask any sensitive claims
          sub: decodedPayload.sub ? '***' : undefined,
          iss: decodedPayload.iss || 'not present',
          aud: decodedPayload.aud || 'not present',
          iat: decodedPayload.iat ? new Date(decodedPayload.iat * 1000).toISOString() : 'not present',
          exp: decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toISOString() : 'not present',
        }, null, 2));
      } catch (e: unknown) {
        const error = e as Error;
        console.warn('Could not decode token:', error.message);
      }
      
    } catch (err: unknown) {
      const error = err as Error & {
        response?: {
          status?: number;
          data?: any;
          headers?: any;
        };
      };
      
      console.error('Authentication failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      throw error; // Re-throw to fail the test
    }
  }, 60000); // Increased timeout to 60 seconds for the API call

  it('should fetch the public key successfully', async () => {
    // First authenticate to get a valid token
    await client.authenticate();
    
    // Act - Call getPublicKey
    const result = await client.getPublicKey();

    console.log(result)
    
    // Assert - Verify the response structure and content
    expect(result).toBeDefined();
    expect(result.status).toBe('SUCCESS');
    
    // Add type guard to ensure data exists
    if (!result.data) {
      throw new Error('No data in response');
    }    
    expect(result.data).toBeDefined();
    expect(typeof result.data.key).toBe('string');
    
    // Verify the key format (should be a PEM-encoded public key)
    const publicKey = result.data.key;
    const pemRegex = /^-----BEGIN PUBLIC KEY-----\n[A-Za-z0-9+/=\n]+-----END PUBLIC KEY-----\n?$/;
    expect(publicKey).toMatch(pemRegex);
    
    console.log('Successfully retrieved public key');
  }, 30000); // 30 seconds timeout for the public key fetch


  it('should complete Aadhaar OTP flow: generate and verify', async () => {
    // First authenticate to get a valid token
    await client.authenticate();

    // Prompt for manual input
    console.log('\n=== Manual Input Required ===');
    const aadhaarNumber = readlineSync.question('Enter the Aadhaar number to use: ');
    const mobileNumber = readlineSync.question('Enter your mobile number: ');
    console.log('=== End Manual Input ===\n');

    if (!aadhaarNumber || !mobileNumber) {
      throw new Error('Aadhaar number and mobile number are required for OTP generation');
    }

    // Step 1: Generate OTP
    const generateResponse = await client.generateAadhaarOTP({
      aadhaarNumber,
      txnId: "",
    });
    console.log('Generate OTP response:', JSON.stringify(generateResponse, null, 2));
    expect(generateResponse).toBeDefined();
    if (generateResponse.status === 'ERROR') {
      throw new Error(`Generate OTP failed: ${JSON.stringify(generateResponse, null, 2)}`);
    }
    expect(generateResponse.status).toBe('SUCCESS');
    expect(generateResponse.data).toBeDefined();
    expect(typeof generateResponse.data?.txnId).toBe('string');
    expect(generateResponse.data?.txnId.length).toBeGreaterThan(0);
    const txnId = generateResponse.data!.txnId;
    console.log('Generated transaction ID:', txnId);

    // Prompt for OTP
    const testOtp = readlineSync.question('Enter the OTP received on your mobile: ');
    if (!testOtp) {
      throw new Error('OTP is required for verification');
    }

    // Step 2: Verify OTP
    const verifyResponse = await client.verifyAadhaarOTP({
      txnId,
      otpValue: testOtp,
      mobile: mobileNumber
    });
    console.log('Aadhaar OTP verification response:', JSON.stringify(verifyResponse, null, 2));
    if (verifyResponse.status === 'ERROR') {
      throw new Error(`API returned error: ${JSON.stringify(verifyResponse, null, 2)}`);
    }
    expect(verifyResponse).toBeDefined();
    expect(verifyResponse.status).toBe('SUCCESS');
    expect(verifyResponse.data).toBeDefined();
    if (verifyResponse.data) {
      expect(typeof verifyResponse.data.txnId).toBe('string');
      expect(verifyResponse.data.txnId.length).toBeGreaterThan(0);
      expect(typeof verifyResponse.data.message).toBe('string');
    } else {
      throw new Error('No data in response');
    }
    console.log('Aadhaar OTP verification response:', {
      status: verifyResponse.status,
      txnId: verifyResponse.data?.txnId,
      message: verifyResponse.data?.message,
      isSuccess: verifyResponse.data?.isSuccess
    });
  }, 60000); // 60 seconds timeout for the full flow


  it('should handle invalid transaction ID error', async () => {
    // First authenticate to get a valid token
    await client.authenticate();
    
    // Test data with invalid transaction ID
    const invalidTxnId = ''; // Empty transaction ID
    const testOtp = '123456'; // 6-digit test OTP for sandbox
    
    // Act & Assert - Call verifyAadhaarOTP with invalid transaction ID
    await expect(client.verifyAadhaarOTP({
      txnId: invalidTxnId,
      otpValue: testOtp,
      mobile: '9999999999' // Test mobile number for sandbox
    })).rejects.toThrow('Transaction ID is required');
  }, 10000); // 10 seconds timeout for error handling

  it('should handle invalid OTP value error', async () => {
    // First authenticate to get a valid token
    await client.authenticate();
    
    // Test data with invalid OTP value
    const testTxnId = `TEST-TXN-${Date.now()}`; // Generate a unique transaction ID for testing
    const invalidOtp = ''; // Empty OTP value
    
    // Act & Assert - Call verifyAadhaarOTP with invalid OTP value
    await expect(client.verifyAadhaarOTP({
      txnId: testTxnId,
      otpValue: invalidOtp,
      mobile: '9999999999' // Test mobile number for sandbox
    })).rejects.toThrow('OTP value is required');
  }, 10000); // 10 seconds timeout for error handling

  it('should handle missing authentication error', async () => {
    // Create a new client instance without authentication
    const unauthenticatedClient = new ABDMClient(config);
    
    // Test data
    const testTxnId = `TEST-TXN-${Date.now()}`; // Generate a unique transaction ID for testing
    const testOtp = '123456'; // 6-digit test OTP for sandbox
    
    // Act & Assert - Call verifyAadhaarOTP without authentication
    await expect(unauthenticatedClient.verifyAadhaarOTP({
      txnId: testTxnId,
      otpValue: testOtp,
      mobile: '9999999999' // Test mobile number for sandbox
    })).rejects.toThrow('Not authenticated');
  }, 10000); // 10 seconds timeout for error handling

  it('should handle production environment error', async () => {
    // Create a client configured for production environment
    const productionConfig = {
      ...config,
      useSandbox: false
    };
    const productionClient = new ABDMClient(productionConfig);
    
    // Test data
    const testTxnId = `TEST-TXN-${Date.now()}`; // Generate a unique transaction ID for testing
    const testOtp = '123456'; // 6-digit test OTP for sandbox
    
    // Act & Assert - Call verifyAadhaarOTP in production environment
    await expect(productionClient.verifyAadhaarOTP({
      txnId: testTxnId,
      otpValue: testOtp,
      mobile: '9999999999' // Test mobile number for sandbox
    })).rejects.toThrow('Only sandbox environment is currently supported');
  }, 10000); // 10 seconds timeout for error handling
});
