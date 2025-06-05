import axios, { AxiosInstance } from 'axios';
import { ABDMClient } from '../../src/abdm-client';
import { HttpClient } from '../../src/utils/http-client';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create a mock Axios instance with interceptors
const createMockAxiosInstance = () => {
  const instance = {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
        clear: jest.fn(),
      },
    },
  };
  return instance;
};

// Create a mock axios instance
const mockAxiosInstance = createMockAxiosInstance();

// Mock the axios.create method to return our mock instance
mockedAxios.create.mockReturnValue(mockAxiosInstance as unknown as AxiosInstance);

describe('ABDMClient Integration', () => {
  let client: ABDMClient;
  const config = {
    clientId: 'test-client',
    clientSecret: 'test-secret',
    environment: 'sandbox' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the mock instance
    Object.assign(mockAxiosInstance, createMockAxiosInstance());
    
    // Setup default mock implementations
    mockAxiosInstance.request.mockImplementation(async (config) => ({
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }));
    
    client = new ABDMClient(config);
  });

  describe('Initialization', () => {
    it('should initialize with provided configuration', () => {
      expect(client).toBeInstanceOf(ABDMClient);
      // @ts-ignore - Accessing private property for testing
      expect(client.m1).toBeDefined();
      // @ts-ignore - Accessing private property for testing
      expect(client.m2).toBeDefined();
    });

    it('should throw error when clientId or clientSecret is missing', () => {
      // @ts-ignore - Testing invalid input
      expect(() => new ABDMClient({})).toThrow('clientId and clientSecret are required');
      // @ts-ignore - Testing invalid input
      expect(() => new ABDMClient({ clientId: 'test' })).toThrow('clientId and clientSecret are required');
      // @ts-ignore - Testing invalid input
      expect(() => new ABDMClient({ clientSecret: 'test' })).toThrow('clientId and clientSecret are required');
    });
  });

  describe('Authentication', () => {
    const mockAuthResponse = {
      data: {
        accessToken: 'test-access-token',
        expiresIn: 3600,
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer'
      },
      status: 200
    };

    beforeEach(() => {
      mockedAxios.post.mockResolvedValue(mockAuthResponse);
    });

    it('should authenticate and set auth token', async () => {
      await client.authenticate();
      expect(axios.post).toHaveBeenCalledWith(
        'https://dev.abdm.gov.in/gateway/v0.5/sessions',
        {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(client.getAuthToken()).toBe('test-access-token');
      expect(client.isTokenValid()).toBe(true);
    });

    it('should handle authentication failure', async () => {
      const error = new Error('Network Error');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(client.authenticate()).rejects.toThrow('Failed to authenticate with ABDM');
      expect(client.getAuthToken()).toBeNull();
      expect(client.isTokenValid()).toBe(false);
    });
  });

  describe('Token Management', () => {
    it('should set and clear auth token', () => {
      // Set a token with a future expiry
      const token = 'test-token';
      const expiresIn = 3600; // 1 hour
      
      // Create a fixed date for testing
      const now = new Date('2023-01-01T00:00:00Z');
      const futureDate = new Date(now.getTime() + (expiresIn - 300) * 1000);
      
      // Mock Date.now to return our fixed timestamp
      jest.spyOn(global.Date, 'now').mockImplementation(() => now.getTime());
      
      try {
        // Set auth token with expiry
        client.setAuthToken(token, expiresIn);
        
        // Verify token is set
        expect(client.getAuthToken()).toBe(token);
        
        // Mock Date.now and Date.prototype.getTime to return a time before expiry
        jest.spyOn(global.Date, 'now').mockImplementation(() => now.getTime() + 1000);
        const originalGetTime = Date.prototype.getTime;
      jest.spyOn(Date.prototype, 'getTime').mockImplementation(function (this: Date) {
        if (typeof this.toISOString === 'function' && this.toISOString() === now.toISOString()) {
          return now.getTime() + 1000;
        }
        return originalGetTime.apply(this);
      });
        
        // Verify token is valid (not expired)
        expect(client.isTokenValid()).toBe(true);

        // Mock Date.now to return a time after expiry
        jest.spyOn(global.Date, 'now').mockImplementation(() => futureDate.getTime() + 1000);
        
        // Verify token is now expired
        expect(client.isTokenValid()).toBe(false);
        
        // Clear the token
        client.clearAuthToken();
        
        // Verify token is cleared
        expect(client.getAuthToken()).toBeNull();
        expect(client.isTokenValid()).toBe(false);
      } finally {
        // Restore original Date.now
        jest.restoreAllMocks();
      }
    });
  });

  describe('Service Integration', () => {
    beforeEach(() => {
      // Mock a successful authentication
      client.setAuthToken('test-token');
    });

    it('should delegate M1 service calls', async () => {
      // Mock M1 service response
      const mockResponse = { txnId: 'txn-123' };
      // @ts-ignore - Accessing private property for testing
      const mockImplementation = jest.fn().mockResolvedValue({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });
      
      // @ts-ignore - Accessing private property for testing
      client.m1.sendAadhaarOTP = mockImplementation;

      // @ts-ignore - Accessing private property for testing
      const result = await client.m1.sendAadhaarOTP('123456789012');
      expect(mockImplementation).toHaveBeenCalledWith('123456789012');
      expect(result).toEqual({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });
    });

    it('should delegate M2 service calls', async () => {
      // Mock M2 service response
      const mockResponse = { token: 'test-token' };
      const request = {
        abhaAddress: 'user@abdm',
        linkToken: 'test-link-token',
        response: { requestId: 'req-123' }
      };
      
      // @ts-ignore - Accessing private property for testing
      const mockImplementation = jest.fn().mockResolvedValue({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });
      
      // @ts-ignore - Accessing private property for testing
      client.m2.generateToken = mockImplementation;

      // @ts-ignore - Accessing private property for testing
      const result = await client.m2.generateToken(request);
      expect(mockImplementation).toHaveBeenCalledWith(request);
      expect(result).toEqual({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });
    });
  });
});
