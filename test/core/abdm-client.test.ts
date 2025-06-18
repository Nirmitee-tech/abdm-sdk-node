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
});
