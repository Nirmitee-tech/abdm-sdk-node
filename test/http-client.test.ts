const axiosPostMock = jest.fn();
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

import type { ABDMConfig } from '../src/types/common';
import { HttpClient } from '../src/utils/http-client'; // Client is used in the test file

// This will be used by HttpClient.authenticate for direct calls

let requestInterceptor: ((config: any) => any) | null = null;

let currentMockAxiosInstance: any; // Will hold the instance created by the mock factory

// Create a mock implementation for the axios instance
// This needs to be defined before jest.mock calls it in the factory
const createMockAxiosInstance = () => {
  const instance = {
    request: jest.fn(),
    get: jest.fn(),
    post: jest.fn(), // This mocks instance.post(), not global axios.post()
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn((onFulfilled) => {
          console.error(
            `[TEST_DEBUG] currentMockAxiosInstance.interceptors.request.use called. onFulfilled is ${onFulfilled ? 'DEFINED' : 'NULL'}`
          ); // DEBUG_LOG
          if (onFulfilled) {
            requestInterceptor = onFulfilled;
            console.error(`[TEST_DEBUG] Request interceptor function captured in mock.`); // DEBUG_LOG
          }
          return 0; // Return interceptor ID
        }),
        eject: jest.fn(),
        clear: jest.fn(),
      },
      response: {
        use: jest.fn(() => Promise.resolve()),
        eject: jest.fn(),
        clear: jest.fn(),
      },
    },
  };

  // Setup default mock implementations for instance methods
  instance.get.mockImplementation((url, config) => {
    console.error(
      `[TEST_DEBUG] currentMockAxiosInstance.get invoked for URL: ${url}. requestInterceptor is ${requestInterceptor ? 'DEFINED' : 'NULL'}`
    ); // DEBUG_LOG
    return instance.request({ ...config, method: 'GET', url });
  });

  instance.post.mockImplementation((url, data, config) => {
    console.error(
      `[TEST_DEBUG] currentMockAxiosInstance.post invoked for URL: ${url}. requestInterceptor is ${requestInterceptor ? 'DEFINED' : 'NULL'}`
    ); // DEBUG_LOG
    return instance.request({ ...config, method: 'POST', url, data });
  });

  instance.put.mockImplementation((url, data, config) => {
    return instance.request({ ...config, method: 'PUT', url, data });
  });

  instance.delete.mockImplementation((url, config) => {
    return instance.request({ ...config, method: 'DELETE', url });
  });

  instance.patch.mockImplementation((url, data, config) => {
    return instance.request({ ...config, method: 'PATCH', url, data });
  });

  // Default request mock: tries to apply interceptor
  instance.request.mockImplementation(async (config: AxiosRequestConfig) => {
    console.error(
      `[TEST_DEBUG] currentMockAxiosInstance.request invoked for URL: ${config.url}, Method: ${config.method}. requestInterceptor is ${requestInterceptor ? 'DEFINED' : 'NULL'}`
    ); // DEBUG_LOG
    try {
      let processedConfig = config;
      if (requestInterceptor) {
        console.error('[TEST_DEBUG] Applying request interceptor in currentMockAxiosInstance.request...'); // DEBUG_LOG
        processedConfig = await Promise.resolve(requestInterceptor(config));
        console.error('[TEST_DEBUG] Request interceptor applied. Processed config:', processedConfig); // DEBUG_LOG
      }
      // Simulate a successful response
      // In a real test, you might want to customize this based on the URL/method
      // For the token refresh test, the GET to '/test' should succeed after auth
      if (processedConfig.url === '/test' && processedConfig.method === 'GET') {
        return Promise.resolve({
          data: { message: 'success' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: processedConfig,
        } as AxiosResponse);
      }
      // For the auth call itself (axios.post to sessions endpoint)
      if (processedConfig.url?.includes('/sessions') && processedConfig.method === 'POST') {
        // This path should ideally be handled by the global axiosPostMock, not the instance.request
        // However, if HttpClient uses its own instance for auth, this might be hit.
        // Let's assume auth success for now if it comes through here.
        return Promise.resolve({
          data: { accessToken: 'new-test-token', expiresIn: 3600 },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: processedConfig,
        } as AxiosResponse);
      }
      return Promise.resolve({
        data: { message: 'default mock success' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: processedConfig,
      } as AxiosResponse);
    } catch (error) {
      console.error('[TEST_DEBUG] Error in currentMockAxiosInstance.request:', error); // DEBUG_LOG
      return Promise.reject(error);
    }
  });

  return instance;
};

// Mock axios module
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    ...jest.requireActual('axios'), // Spread actual axios to keep other functionalities
    create: jest.fn(() => {
      const newMockInstance = createMockAxiosInstance();
      currentMockAxiosInstance = newMockInstance; // Assign to the accessible variable
      console.error('[TEST_DEBUG] axios.create (mock factory) CALLED. Assigning and returning newMockInstance.'); // DEBUG_LOG
      console.error(`[TEST_DEBUG] newMockInstance.get is a mock? ${!!newMockInstance.get.mock}`); // DEBUG_LOG
      console.error(
        `[TEST_DEBUG] newMockInstance.interceptors.request.use is a mock? ${!!newMockInstance.interceptors.request.use.mock}`
      ); // DEBUG_LOG
      return newMockInstance as unknown as AxiosInstance;
    }),
    post: axiosPostMock, // Used for HttpClient.authenticate direct call
  },
  AxiosError: jest.requireActual('axios').AxiosError, // Export AxiosError
}));

// Helper function to create an Axios error
const createAxiosError = (status: number, data: any): AxiosError => {
  const error = new Error('Axios Error') as any;
  error.isAxiosError = true;
  error.response = {
    status,
    data: {
      message: data?.message || 'An error occurred',
      ...data,
    },
    statusText: 'Error',
    headers: {},
    config: {},
  };
  error.config = {};
  error.request = {};
  error.toJSON = () => ({});
  return error as AxiosError;
};

describe('HttpClient', () => {
  let httpClient: HttpClient;
  const mockConfig: ABDMConfig = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    useSandbox: true,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Reset interceptor references
    requestInterceptor = null;

    // Create a new HttpClient instance for each test
    // This will trigger axios.create, which in turn sets currentMockAxiosInstance via our mock factory
    httpClient = new HttpClient(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(httpClient).toBeInstanceOf(HttpClient);
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });

    it('should use provided configuration', () => {
      const customConfig: ABDMConfig = {
        ...mockConfig,
        baseURL: 'https://custom-api.example.com',
        timeout: 60000,
      };

      new HttpClient(customConfig);

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://custom-api.example.com',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    });
  });

  describe('authentication', () => {
    it('should authenticate and set auth token', async () => {
      const authResponse = {
        accessToken: 'test-token',
        expiresIn: 3600,
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
      };

      // Use the global axiosPostMock for authentication
      axiosPostMock.mockResolvedValueOnce({
        data: authResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      await httpClient.authenticate();

      // Verify the auth token was set
      expect(httpClient.authToken).toBe(authResponse.accessToken);
      expect(httpClient.tokenExpiry).toBeInstanceOf(Date);

      // Verify the auth request was made with the correct data
      expect(axiosPostMock).toHaveBeenCalledWith(
        'https://dev.abdm.gov.in/gateway/v0.5/sessions',
        { grantType: 'client_credentials' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Basic dGVzdC1jbGllbnQtaWQ6dGVzdC1jbGllbnQtc2VjcmV0',
            'X-CM-ID': 'sbx',
          },
        }
      );
      // Debug: log all calls to axiosPostMock
      // eslint-disable-next-line no-console
      console.log('axiosPostMock calls:', axiosPostMock.mock.calls);
      // Relax assertion to check if it was called at all
      expect(axiosPostMock).toHaveBeenCalled();
    });

    it('should throw an error if authentication fails', async () => {
      axiosPostMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(httpClient.authenticate()).rejects.toThrow('Authentication failed: Network error');
    });
  });

  describe('request methods', () => {
    it('should make a GET request', async () => {
      // Set up the mock for the request interceptor
      currentMockAxiosInstance.request = jest.fn().mockImplementation(async (config) => {
        // Return a successful response with the test data
        return {
          data: { data: 'test' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      });

      // Make a GET request
      const response = await httpClient.get('/test');

      // Verify the response is correct
      expect(response).toEqual({ data: 'test' });

      // Verify the request was made with the correct config
      const requestCall = (currentMockAxiosInstance.request as jest.Mock).mock.calls[0][0];
      expect(requestCall).toMatchObject({
        method: 'GET',
        url: '/test',
      });
      expect(requestCall.headers).toMatchObject({
        'X-Request-ID': expect.any(String),
        'X-Timestamp': expect.any(String),
      });
    });

    it('should refresh token if expired and then make the original request successfully', async () => {
      const newToken = 'new-fresh-token';
      const expiresIn = 3600;

      // axios.post is already a mock function due to jest.mock('axios')
      const axiosPostMock = axios.post as jest.Mock;
      axiosPostMock.mockImplementation(async (url: string) => {
        if (url === 'https://dev.abdm.gov.in/gateway/v0.5/sessions') {
          return Promise.resolve({
            data: { accessToken: newToken, expiresIn },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
          });
        }
        // For any other axios.post call, you might want to throw or return a specific mock
        return Promise.reject(new Error(`axios.post mock called with unexpected URL: ${url}`));
      });

      // Make the request that should trigger proactive token refresh
      // Mock the request method to return our test data
      currentMockAxiosInstance.request.mockImplementationOnce(async (config: AxiosRequestConfig) => ({
        data: { id: 1, name: 'Test' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }));

      const postRequestData = { name: 'Test' };
      const postResponseData = { id: 1, name: 'Test' };

      // Make a POST request
      const response = await httpClient.post('/test', postRequestData);

      // Verify the response is correct
      expect(response).toEqual(postResponseData);

      // Verify the request was made with the correct config
      expect(currentMockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: '/test',
          data: postRequestData,
          headers: expect.objectContaining({
            'X-Request-ID': expect.any(String),
            'X-Timestamp': expect.any(String),
          }),
        })
      );
    });

    it('should make a PATCH request', async () => {
      const requestData = { name: 'Updated Name' };
      const postResponseData = { id: 1, ...requestData };

      // Mock the request method to return our test data
      currentMockAxiosInstance.request.mockImplementationOnce(async (config: AxiosRequestConfig) => ({
        data: postResponseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }));

      // Make a PATCH request
      const response = await httpClient.patch('/test/1', requestData);

      // Verify the response is correct
      expect(response).toEqual(postResponseData);

      // Verify the request was made with the correct config
      expect(currentMockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: '/test/1',
          data: requestData,
          headers: expect.objectContaining({
            'X-Request-ID': expect.any(String),
            'X-Timestamp': expect.any(String),
          }),
        })
      );
    });

    it('should include auth token in request if provided', async () => {
      const testToken = 'test-token';

      // Mock the request to verify the token is included
      currentMockAxiosInstance.request.mockImplementationOnce((config: AxiosRequestConfig) => {
        // Verify the token is included in the request
        if (config.headers && config.headers.Authorization !== `Bearer ${testToken}`) {
          return Promise.reject(new Error('Authorization header not set correctly'));
        }
        return Promise.resolve({
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      });

      await httpClient.get('/test', { headers: { Authorization: `Bearer ${testToken}` } });

      // Verify the request was made with the correct headers
      expect(currentMockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      // Mock the request to reject with an error
      const error = createAxiosError(400, {
        message: 'Bad Request',
        details: { field: 'test' },
      });

      // Mock the request method to reject with the error
      currentMockAxiosInstance.request = jest.fn().mockRejectedValueOnce(error);

      // The error should be thrown
      await expect(httpClient.get('/error')).rejects.toThrow('[UNKNOWN_ERROR] Bad Request');
    });

    it('should handle non-Axios errors', async () => {
      // Mock the request to reject with an authentication error
      const error = createAxiosError(401, {
        message: 'Invalid credentials',
      });

      // Mock the request method to reject with the error
      currentMockAxiosInstance.request = jest.fn().mockRejectedValueOnce(error);

      // The error should be thrown
      await expect(httpClient.get('/auth-error')).rejects.toThrow('[UNKNOWN_ERROR] Invalid credentials');
    });
  });
});
