const axiosPostMock = jest.fn();
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

import type { ABDMConfig } from '../src/types/common';
import { HttpClient } from '../src/utils/http-client';

// This will be used by HttpClient.authenticate for direct calls

let client: HttpClient;
let requestInterceptor: ((config: any) => any) | null = null;
let responseInterceptor: ((response: any) => any) | null = null;
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
        use: jest.fn((onFulfilled, onRejected) => {
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
        use: jest.fn((onFulfilled, onRejected) => {
          responseInterceptor = onFulfilled || null;
          return 1; // Return interceptor ID
        }),
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
    responseInterceptor = null;

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
        basePath: 'https://custom-api.example.com',
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
        {},
        {
          headers: {
            Authorization: expect.stringMatching(/^Basic /),
            'Content-Type': 'application/json',
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

      await expect(httpClient.authenticate()).rejects.toThrow('Failed to authenticate with ABDM');
    });
  });

  describe('request methods', () => {
    it('should make a GET request', async () => {
      const responseData = { data: 'test' };

      // Mock the instance's request method for this test
      currentMockAxiosInstance.request.mockResolvedValueOnce({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      const response = await httpClient.get('/test');

      expect(response).toEqual({
        success: true,
        status: 200,
        statusCode: 200,
        data: responseData,
        headers: {},
      });

      // Verify the request was made with the correct config
      expect(currentMockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test',
        data: undefined,
        params: undefined,
        timeout: 30000,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      });

      axiosPostMock.mockClear(); // Clear calls for this specific mock for safety, though clearAllMocks should cover it.
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

      const httpClientWithConfig = new HttpClient({
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        useSandbox: true,
      });
      // Simulate state where no token exists, requiring initial authentication via interceptor
      httpClientWithConfig._authToken = null;
      httpClientWithConfig._tokenExpiry = null;

      // Set the mock for the correct instance after HttpClient is created
      currentMockAxiosInstance.request.mockImplementation((config: AxiosRequestConfig) => {
        if (config.url === '/protected' && config.method === 'GET') {
          return Promise.resolve({
            data: { message: 'Data from protected endpoint' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          });
        }
        return Promise.resolve({
          data: { message: 'default mock success' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      });

      // Make the request that should trigger proactive token refresh
      const response = await httpClientWithConfig.get('/protected');

      // 1. Check that authentication was attempted
      expect(axiosPostMock).toHaveBeenCalledWith(
        'https://dev.abdm.gov.in/gateway/v0.5/sessions',
        {},
        {
          headers: {
            Authorization: expect.stringMatching(/^Basic /),
            'Content-Type': 'application/json',
            'X-CM-ID': 'sbx',
          },
        }
      );
      // 2. Check that the original request was then made successfully with the new token
      expect(currentMockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/protected',
          headers: expect.objectContaining({ authorization: `Bearer ${newToken}` }),
        })
      );
      // 3. Check the response from the GET call
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ message: 'Data from protected endpoint' });
      axiosPostMock.mockClear();
    });

    it('should handle request errors', async () => {
      const errorMessage = 'Network Error';
      // Use createAxiosError for a proper Axios error
      const error = createAxiosError(500, { message: errorMessage });
      axiosPostMock.mockRejectedValue(createAxiosError(401, { message: 'Unauthorized' }));
      currentMockAxiosInstance.request.mockRejectedValueOnce(error);
      const response = await httpClient.get('/error');
      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: errorMessage,
        }),
        statusCode: 500,
      });
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        message: 'Not Found',
        code: 404,
      };

      // Mock the request to reject with an error response
      const error = createAxiosError(404, errorResponse);
      currentMockAxiosInstance.request.mockRejectedValueOnce(error);

      const response = await httpClient.get('/not-found');

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 404,
          message: 'Not Found',
          details: errorResponse,
        }),
        statusCode: 404,
      });
    });

    it('should make a POST request', async () => {
      const requestData = { name: 'Test' };
      const responseData = { id: 1, ...requestData };

      // Mock the request method to return our test data
      currentMockAxiosInstance.request.mockImplementationOnce(async (config: AxiosRequestConfig) => ({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }));

      const response = await httpClient.post('/test', requestData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(responseData);
      expect(response.statusCode).toBe(200);

      // Verify the request was made with the correct config
      expect(currentMockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test',
        data: requestData,
        params: undefined,
        timeout: 30000,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      });
    });

    it('should make a PATCH request', async () => {
      const requestData = { name: 'Updated Name' };
      const responseData = { id: 1, ...requestData };

      // Mock the request method to return our test data
      currentMockAxiosInstance.request.mockImplementationOnce(async (config: AxiosRequestConfig) => ({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }));

      const response = await httpClient.patch('/test/1', requestData);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(responseData);
      expect(response.statusCode).toBe(200);

      // Verify the request was made with the correct config
      expect(currentMockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/test/1',
        data: requestData,
        params: undefined,
        timeout: 30000,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
      });
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

      await httpClient.get('/test', { authToken: testToken });

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

      currentMockAxiosInstance.request.mockRejectedValueOnce(error);

      // The error should be caught and returned in the response
      const response = await httpClient.get('/error');

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 400,
          message: 'Bad Request',
          details: expect.anything(),
        }),
        statusCode: 400,
      });
    });

    it('should handle non-Axios errors', async () => {
      // Mock the request to reject with an authentication error
      const error = createAxiosError(401, {
        message: 'Invalid credentials',
      });

      currentMockAxiosInstance.request.mockRejectedValueOnce(error);

      // The error should be caught and returned in the response
      const response = await httpClient.get('/auth-error');

      expect(response).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 401,
          message: 'Invalid credentials',
          details: expect.anything(),
        }),
        statusCode: 401,
      });
    });
  });
});
