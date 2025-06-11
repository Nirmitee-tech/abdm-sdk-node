// Global mocks and test setup

// Mock console methods to keep test output clean
const originalConsole = { ...console };

global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock environment variables
process.env['ABDM_CLIENT_ID'] = 'test-client-id';
process.env['ABDM_CLIENT_SECRET'] = 'test-client-secret';
process.env['ABDM_ENVIRONMENT'] = 'sandbox';

// Add any other global test setup here

// This file is run before each test file
// You can add more setup code here as needed
