import type { ABDMConfig } from '../../src/types';

// Define the response type locally since it's not exported from http-client
type ExtendedAPIResponse<T = any> = {
  status: 'SUCCESS' | 'ERROR';
  data: T;
  statusCode: number;
  headers?: Record<string, string>;
  error?: any;
};

type RequestOptions = {
  url: string;
  method?: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  timeout?: number;
  [key: string]: any;
};

/**
 * A mock HTTP client for testing purposes
 */
export class MockHttpClient {
  // Store mock responses
  private mockResponses: Map<string, any> = new Map();
  private authToken: string | null = null;
  
  // Mock authenticate method
  public authenticate = jest.fn().mockResolvedValue('mock-auth-token');

  constructor(_config: ABDMConfig) {
    // Initialize any required setup
  }

  /**
   * Get the current authentication token
   */
  getAuthToken(): string | null {
    return this.authToken || 'mock-auth-token';
  }

  /**
   * Set the authentication token
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Set a mock response for a specific URL and method
   */
  setMockResponse(
    url: string, 
    method: string, 
    response: any,
    status = 200
  ) {
    const key = `${method.toUpperCase()} ${url}`;
    this.mockResponses.set(key, { response, status });
  }

  /**
   * Mock implementation of the request method
   */
  async request<T = any>(
    config: RequestOptions,
    _serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    const key = `${config.method?.toUpperCase() || 'GET'} ${config.url}`;
    const mockResponse = this.mockResponses.get(key);
    
    if (mockResponse) {
      return {
        status: 'SUCCESS',
        data: mockResponse.response,
        statusCode: mockResponse.status,
        headers: {}
      };
    }
    
    // Default mock response for auth endpoint
    if (config.url?.includes('/v3/sessions') && config.method?.toUpperCase() === 'POST') {
      this.authToken = 'mock-auth-token';
      return {
        status: 'SUCCESS',
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 300,
          refreshExpiresIn: 3600,
          tokenType: 'Bearer'
        } as T,
        statusCode: 200,
        headers: {}
      };
    }
    
    // Default 404 for unmocked endpoints
    return {
      status: 'ERROR',
      data: {} as T,
      error: {
        code: '404',
        message: 'Not Found',
        details: 'No matching resource found for given API Request'
      },
      statusCode: 404,
      headers: {}
    };
  }

  // Mock the HTTP method shorthands
  async get<T = any>(
    url: string,
    config: Omit<RequestOptions, 'method' | 'url'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url }, serviceType);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestOptions, 'method' | 'url' | 'data'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data }, serviceType);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestOptions, 'method' | 'url' | 'data'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data }, serviceType);
  }

  async delete<T = any>(
    url: string,
    config: Omit<RequestOptions, 'method' | 'url'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url }, serviceType);
  }
}
