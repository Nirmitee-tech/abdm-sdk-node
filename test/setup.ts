// Global test setup
import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

// Add TextEncoder and TextDecoder to global for tests
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock console methods for testing
const originalConsole = { ...console };

// Override console methods with mocks
(global as any).console = {
  ...originalConsole,
  debug: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
