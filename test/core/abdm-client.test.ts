import { ABDMClient } from '../../src/core/abdm-client';
import { HttpClient } from '../../src/utils/http-client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.test
const envPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: envPath });

// Test configuration - using real credentials from environment variables
const config = {
  clientId: process.env.ABDM_CLIENT_ID!,
  clientSecret: process.env.ABDM_CLIENT_SECRET!,
  useSandbox: true,
};

// Skip tests if required environment variables are not set
const describeIf = (condition: boolean) => 
  condition ? describe : describe.skip;

const hasRequiredEnvVars = !!config.clientId && !!config.clientSecret;

describeIf(hasRequiredEnvVars)('ABDMClient Integration Tests', () => {
  let client: ABDMClient;

  beforeEach(() => {
    // Create a new instance of ABDMClient with real configuration
    client = new ABDMClient({
      ...config,
      // Add any additional test-specific configuration here
    });
  });

  describe('authenticate', () => {
    it('should authenticate with ABDM API and store a valid token', async () => {
      // Act - Call authenticate which should store the token internally
      await client.authenticate();
      
      // Get the stored token from the http client
      const httpClient = (client as any).http as HttpClient;
      const token = httpClient.getAuthToken();
      
      // Assert - Verify we got a non-empty string token
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      // Log the token for debugging purposes - using process.stdout.write to ensure output
      process.stdout.write('\n--- Authentication Token Details ---\n');
      process.stdout.write(`Token: ${token}\n`);
      
      // Verify the token is in JWT format (3 parts separated by dots)
      if (token) {
        const tokenParts = token.split('.');
        expect(tokenParts).toHaveLength(3);
        
        // Log token parts (header, payload, signature)
        console.log('\nToken Parts:');
        console.log(`Header:  ${tokenParts[0]}`);
        console.log(`Payload: ${tokenParts[1]}`);
        console.log(`Sig:     ${tokenParts[2].substring(0, 20)}...`);
        
        // Try to decode and log the payload if it's base64 encoded
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
          console.log('\nToken Payload:');
          console.log(JSON.stringify(payload, null, 2));
        } catch (e) {
          console.warn('Could not decode token payload:', e);
        }
      } else {
        fail('Token should not be null or undefined');
      }
    }, 30000); // Increased timeout for API call

    it('should store the auth token after successful authentication', async () => {
      // Act - Call authenticate which should store the token internally
      await client.authenticate();
      
      // Get the stored token from the http client
      const httpClient = (client as any).http as HttpClient;
      const token = httpClient.getAuthToken();

      // Assert - Verify the token is stored and valid
      expect(token).toBeTruthy();
      
      // Verify the token is in JWT format
      if (token) {
        const tokenParts = token.split('.');
        expect(tokenParts).toHaveLength(3);
      } else {
        fail('Stored token should not be null or undefined');
      }
    }, 30000);
  });
});

// Only run these tests if environment variables are not set
describeIf(!hasRequiredEnvVars)('ABDMClient (Skipped)', () => {
  it('skipped - ABDM_CLIENT_ID and ABDM_CLIENT_SECRET environment variables are required', () => {
    console.warn('Skipping integration tests: ABDM_CLIENT_ID and ABDM_CLIENT_SECRET environment variables are required');
  });
});
