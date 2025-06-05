import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
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
        let customAuthToken = (internalConfig as CustomAxiosRequestConfig).authToken;
        let currentToken = customAuthToken || this._authToken;
        let currentTokenExpiry = this._tokenExpiry;

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

        // Ensure headers object exists
        if (!internalConfig.headers) {
          internalConfig.headers = new AxiosHeaders();
        }

        // Add the token to headers if available
        if (currentToken) {
          (internalConfig.headers as AxiosHeaders).set('Authorization', `Bearer ${currentToken}`);
        }

        // Ensure standard headers are present if not already set by specific request
        if (!(internalConfig.headers as AxiosHeaders).has('Content-Type')) {
          (internalConfig.headers as AxiosHeaders).set('Content-Type', 'application/json');
        }
        if (!(internalConfig.headers as AxiosHeaders).has('Accept')) {
          (internalConfig.headers as AxiosHeaders).set('Accept', 'application/json');
        }

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
      const response = await axios.post(
        authUrl,
        {
          clientId: this.config.clientId,
          clientSecret: this.config.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { accessToken, expiresIn } = response.data;
      this._authToken = accessToken;
      // Set expiry to 5 minutes before the actual expiry to be safe
      this._tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
    } catch (error) {
      console.error('Authentication failed:', error);
      throw new Error('Failed to authenticate with ABDM');
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

    // IMPORTANT: The Postman collection shows this endpoint under abhasbx.abdm.gov.in
    // This implies it might need a different base URL or a full URL request.
    // For now, assuming it can be reached via the standard configured baseUrl + path.
    // This needs verification. Let's use a placeholder path for now and assume it returns the key directly.
    // The actual Cert API from Postman M1 is: https://abhasbx.abdm.gov.in/abha/api/v3/profile/public/certificate
    // This might require a specific client instance or a way to make requests to different base URLs.
    // For simplicity in this step, we'll use a relative path and assume it's on the same `baseUrl`.
    // This will likely need refinement.

    // The actual Cert API from Postman M1 is: https://abhasbx.abdm.gov.in/abha/api/v3/profile/public/certificate
    // This request requires an Authorization token.
    const absolutePublicKeyUrl =
      'https://abhasbx.abdm.gov.in/abha/api/v3/profile/public/certificate';

    try {
      // Axios will use the absolute URL if provided, ignoring the instance's baseURL.
      // The interceptor should still add the Authorization header.
      const response = await this.get<{ publicKey: string }>(absolutePublicKeyUrl);
      if (response.success && response.data?.publicKey) {
        this._publicKey = response.data.publicKey; // Assuming the response structure is { publicKey: "..." }
        return this._publicKey!;
      } else {
        console.error('Failed to fetch public key:', response.error);
        const errorMessage =
          typeof response.error === 'string' ? response.error : response.error?.message;
        throw new Error(
          `Failed to fetch public key. Status: ${response.status}, Error: ${errorMessage}`
        );
      }
    } catch (error) {
      console.error('Error fetching public key:', error);
      throw new Error('Error fetching public key.');
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
    } catch (error) {
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
