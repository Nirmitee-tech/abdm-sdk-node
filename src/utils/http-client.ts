import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';

// Extend AxiosRequestConfig to include our custom properties
interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  authToken?: string;
}

import { ABDMConfig, APIResponse, RequestOptions } from '@/types/common';

/**
 * HTTP client for making requests to ABDM APIs
 */
export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly config: ABDMConfig;
  private _authToken: string | null = null;
  private _tokenExpiry: Date | null = null;
  private _publicKey: string | null = null;

  /**
   * Get the public key
   */
  public get publicKey(): string | null {
    return this._publicKey;
  }

  /**
   * Set the public key
   */
  public set publicKey(key: string | null) {
    this._publicKey = key;
  }

  /**
   * Get the current authentication token
   */
  public get authToken(): string | null {
    return this._authToken;
  }

  /**
   * Set the authentication token
   */
  public set authToken(token: string | null) {
    this._authToken = token;
  }

  /**
   * Get the token expiry date
   */
  public get tokenExpiry(): Date | null {
    return this._tokenExpiry;
  }

  /**
   * Set the token expiry date
   */
  public set tokenExpiry(expiry: Date | null) {
    this._tokenExpiry = expiry;
  }

  constructor(config: ABDMConfig) {
    this.config = {
      clientId: config.clientId, // Ensure clientId and clientSecret are part of the stored config
      clientSecret: config.clientSecret,
      xcmId: config.xcmId,
      basePath: config.basePath || 'https://dev.abdm.gov.in/gateway', // Default to dev gateway
      useSandbox: config.useSandbox !== undefined ? config.useSandbox : true, // Default to sandbox true if not specified
      timeout: config.timeout || 30000,
      ...config, // Spread the rest of the config, allowing overrides
    };

    this.client = axios.create({
      baseURL: this.config.basePath, // Use basePath for axios baseURL
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add request interceptor for auth
    this.client.interceptors.request.use(
      async axiosConfig => {
        // Cast to InternalAxiosRequestConfig for internal manipulation if needed, but ensure it's compatible.
        // For Axios interceptors, the config param is InternalAxiosRequestConfig.
        const internalConfig = axiosConfig as import('axios').InternalAxiosRequestConfig;

        // Skip auth for auth requests to avoid infinite loops
        // Skip auth for auth requests to avoid infinite loops
        // The auth URL is typically <basePath>/v0.5/sessions
        const authPathSegment = '/v0.5/sessions';
        if (internalConfig.url?.endsWith(authPathSegment)) {
          return internalConfig;
        }

        // Use 'as any' or type assertion for custom properties if not extending AxiosRequestConfig globally
        const customAuthToken = (internalConfig as CustomAxiosRequestConfig).authToken;
        let currentToken = customAuthToken || this._authToken;
        const currentTokenExpiry = this._tokenExpiry;

        if (currentToken && !customAuthToken) {
          // Only check expiry for internally managed token
          if (currentTokenExpiry && new Date() >= currentTokenExpiry) {
            console.log('Internal token expired.');
            currentToken = null; // Token expired
          }
        }

        // If no valid token, and we have credentials, try to authenticate
        if (!currentToken && this.config.clientId && this.config.clientSecret) {
          try {
            console.log('Attempting to re-authenticate to get new token...');
            await this.authenticate();
            currentToken = this._authToken;
          } catch (error) {
            console.error('Failed to re-authenticate with ABDM during request:', error);
            // Proceed without a token; the API call will likely fail with an auth error.
          }
        }

        // Create a new headers object
        const headers: Record<string, string | number | boolean> = {};
        
        // Copy existing headers if they exist
        if (internalConfig.headers) {
          Object.entries(internalConfig.headers).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              headers[key.toLowerCase()] = String(value);
            }
          });
        }

        // Add the token to headers if available
        if (currentToken) {
          headers['authorization'] = `Bearer ${currentToken}`;
        }

        // Ensure standard headers are present
        if (!headers['content-type']) {
          headers['content-type'] = 'application/json';
        }
        if (!headers['accept']) {
          headers['accept'] = 'application/json';
        }

        // Assign headers back to config with type assertion
        internalConfig.headers = headers as any;

        // Remove custom authToken from config to prevent it from being sent by axios
        // Need to be careful if other parts of axios might try to access it.
        // It's safer if CustomAxiosRequestConfig is used consistently or if the property is truly internal.
        delete (internalConfig as CustomAxiosRequestConfig).authToken;

        return internalConfig;
      },
      error => Promise.reject(error)
    );
  }

  /**
   * Authenticate with ABDM and get an access token
   */
  public async authenticate(): Promise<void> {
    try {
      const authUrl = `${this.config.basePath}/v0.5/sessions`;
      
      // Create Basic Auth header
      const authString = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        authUrl,
        {}, // Empty body as per ABDM API
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authString}`,
            'X-CM-ID': this.config.xcmId || 'sbx', // Default to 'sbx' for sandbox
          },
        }
      );

      const { accessToken, expiresIn } = response.data;
      if (!accessToken) {
        throw new Error('No access token received in response');
      }
      
      this._authToken = accessToken;
      // Set expiry to 5 minutes before the actual expiry to be safe
      this._tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
      
      console.log('Successfully authenticated with ABDM. Token expires at:', this._tokenExpiry);
    } catch (error: any) {
      const errorInfo: any = {
        message: error.message || 'Unknown error',
      };

      // Check if it's an Axios error
      if (error.isAxiosError) {
        errorInfo.status = error.response?.status;
        errorInfo.statusText = error.response?.statusText;
        errorInfo.data = error.response?.data;
        
        errorInfo.config = {
          url: error.config?.url,
          method: error.config?.method,
          headers: {
            ...(error.config?.headers || {}),
            Authorization: error.config?.headers?.Authorization ? '***REDACTED***' : undefined,
          },
        };
      }
      
      console.error('Authentication failed:', errorInfo);
      throw new Error(`Failed to authenticate with ABDM: ${errorInfo.message}`);
    }
  }



  /**
   * Make a GET request
   */
  public async get<T = any>(url: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request('GET', url, undefined, options);
  }

  /**
   * Make a POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.request('POST', url, data, options);
  }

  /**
   * Make a PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.request('PUT', url, data, options);
  }

  /**
   * Make a DELETE request
   */
  public async delete<T = any>(url: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request('DELETE', url, undefined, options);
  }

  /**
   * Make a PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    return this.request('PATCH', url, data, options);
  }

  /**
   * Fetches the ABDM public key for encryption if not already cached.
   * The specific endpoint for the public key needs to be confirmed.
   * Assuming it's '/v3/profile/public/certificate' based on Postman collection for ABHA.
   * This might need adjustment based on which service's public key is needed.
   */
  public async fetchAbhaPublicKey(): Promise<string> {
    if (this._publicKey) {
      return this._publicKey;
    }

    try {
      // First, ensure we have a valid auth token
      if (!this._authToken) {
        await this.authenticate();
      }

      // The public key endpoint path - this should be relative to the base URL
      const publicKeyPath = '/api/v3/profile/public/certificate';
      const baseUrl = this.config.baseUrl || this.config.basePath;
      
      if (!baseUrl) {
        throw new Error('No base URL configured for fetching public key');
      }
      
      // Log the public key request for debugging
      if (this.config.debug) {
        console.log('Fetching public key from:', `${baseUrl}${publicKeyPath}`);
      }
      
      // Make the request to get the public key
      const response = await this.client.get<{ publicKey: string }>(publicKeyPath, {
        baseURL: baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CM-ID': this.config.xcmId || 'sbx',
        },
      });

      if (!response.data?.publicKey) {
        throw new Error('No public key found in response');
      }
      
      this._publicKey = response.data.publicKey;
      return this._publicKey;
    } catch (error: any) {
      console.error('Error fetching public key:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      
      throw new Error(`Failed to fetch public key: ${error.message}`);
    }
  }

  /**
   * Encrypts data using the fetched ABDM public key.
   * @param data The string data to encrypt.
   * @returns The Base64 encoded encrypted string.
   */
  public async encryptWithPublicKey(data: string): Promise<string> {
    const publicKey = await this.fetchAbhaPublicKey();
    try {
      const buffer = Buffer.from(data, 'utf8');
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        buffer
      );
      return encrypted.toString('base64');
    } catch (error: any) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data with public key.');
    }
  }

  /**
   * Base request method
   */
  public async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    try {
      // Create the request config with our custom type
      const config: CustomAxiosRequestConfig = {
        method,
        url,
        data,
        params: options.params || undefined,
        timeout: options.timeout || this.config.timeout,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      };

      // If authToken is provided, add it to the config for the interceptor to handle
      if (options.authToken) {
        config.authToken = options.authToken;
        // Also set the Authorization header directly in case the interceptor doesn't run
        (config.headers as any)['Authorization'] = `Bearer ${options.authToken}`;
      }

      const response = await this.client.request<T>(config);

      return {
        success: true,
        status: response.status,
        statusCode: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>,
      };
    } catch (error: any) {
      // For network errors, rethrow the error to be caught by the test
      if (error.message === 'Network Error') {
        throw error;
      }

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status || 500;
        const errorData = error.response.data || { message: error.message };

        // Format the error response to match the expected structure
        const errorResponse = {
          success: false,
          statusCode: status,
          status,
          error: {
            code: status,
            message: errorData.message || 'An error occurred',
            details: errorData,
          },
          headers: error.response.headers as Record<string, string>,
        };

        return errorResponse;
      } else if (error.request) {
        // The request was made but no response was received
        return {
          success: false,
          statusCode: 0,
          status: 0,
          error: {
            code: 0,
            message: 'No response received from server',
            details: {},
          },
        };
      } else {
        // Something happened in setting up the request that triggered an Error
        return {
          success: false,
          statusCode: 0,
          status: 0,
          error: {
            code: 0,
            message: error.message || 'Unknown error occurred',
            details: {},
          },
        };
      }
    }
  }
}
