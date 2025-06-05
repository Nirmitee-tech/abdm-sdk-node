// Configuration for the ABDM SDK examples
// Replace these values with your actual credentials

export const config = {
  // Sandbox environment
  clientId: process.env.ABDM_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.ABDM_CLIENT_SECRET || 'your-client-secret',
  environment: 'sandbox' as const, // or 'production'
  
  // Common test data
  testMobile: '9999999999', // Test mobile number for OTP
  testTxnId: 'a825f76b-0696-40f3-864c-5a3a5b389a83', // Sample transaction ID
  testAbhaAddress: 'user@abdm', // Sample ABHA address
  testHealthId: 'user@abdm', // Sample Health ID
  
  // Common headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CM-ID': 'sbx', // For sandbox, use 'sbx'. For production, use 'prod'
  },
};

// Helper function to create a delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export { delay };
