import { ABDMClient } from '../../src/core/abdm-client';
import dotenv from 'dotenv';
import path from 'path';

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

  it('should generate Aadhaar OTP successfully', async () => {
    // First authenticate to get a valid token
    await client.authenticate();
    
    // Test data
    const testAadhaar = '123456789012'; // 12-digit test Aadhaar number
    // const txnId = `TEST-${Date.now()}`; // Generate a unique transaction ID for testing
    
    // Act - Call generateAadhaarOTP
    const response = await client.generateAadhaarOTP({
      aadhaarNumber: testAadhaar,
      txnId: "",
      requesterId: 'ABHA_TEST'
    });

   process.stdout.write(JSON.stringify(response))
    
    // Assert - Verify the response structure
    expect(response).toBeDefined();
    expect(response.status).toBe('SUCCESS');
    expect(response.data).toBeDefined();
    
    // Verify the response data structure
    if (response.data) {
      expect(typeof response.data.txnId).toBe('string');
      expect(response.data.txnId.length).toBeGreaterThan(0);
      expect(typeof response.data.message).toBe('string');
      expect(response.data.message).toContain('OTP sent');
    } else {
      throw new Error('No data in response');
    }
    
    // Log the response (without sensitive data)
    console.log('Aadhaar OTP response:', {
      status: response.status,
      txnId: response.data?.txnId,
      message: response.data?.message
    });
  }, 30000); // 30 seconds timeout for the OTP generation
});
