import type { ABDMConfig } from '../../src/types/common';

/**
 * Creates a mock ABDMConfig for testing
 */
export const createTestConfig = (overrides: Partial<ABDMConfig> = {}): ABDMConfig => ({
  clientId: 'test-client-id',
  clientSecret: 'test-client-secret',
  useSandbox: true,
  baseURL: 'https://test-api.abdm.gov.in',
  ...overrides,
});

/**
 * Creates a mock successful API response
 */
export const mockSuccessResponse = <T>(data: T, status = 200) => ({
  success: true,
  data,
  statusCode: status,
});

/**
 * Creates a mock error response
 */
export const mockErrorResponse = (message: string, code: string | number = 'ERROR', status = 400) => ({
  success: false,
  error: {
    code,
    message,
  },
  statusCode: status,
});

/**
 * Helper to mock axios responses
 */
export const mockAxiosResponse = <T>(data: T, status = 200) => ({
  data: mockSuccessResponse(data, status),
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {},
});

/**
 * Helper to mock axios errors
 */
export const mockAxiosError = (message: string, status = 400) => ({
  response: {
    data: mockErrorResponse(message, 'ERROR', status),
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  },
  isAxiosError: true,
  toJSON: () => ({}),
  name: 'AxiosError',
  message,
});

/**
 * Sleep helper for testing timeouts
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a mock Date object with a specific timestamp
 */
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  const _Date = Date;
  // @ts-ignore - Mocking Date
  global.Date = class extends _Date {
    constructor() {
      super();
      return mockDate;
    }
    // @ts-ignore - Mocking static now
    static now() {
      return mockDate.getTime();
    }
  };

  // Return a function to restore the original Date
  return () => {
    global.Date = _Date;
  };
};
