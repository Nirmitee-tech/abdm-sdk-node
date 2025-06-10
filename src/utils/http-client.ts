import axios, {
  type AxiosInstance,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestHeaders,
} from 'axios';
import * as crypto from 'crypto';
import { logger } from './logger';
import {
  ABDMConfig,
  APIResponse,
  RequestOptions,
  APIErrorDetails,
} from '../types/common';

// Define a custom request config that includes our authToken property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  authToken?: string;
  headers: AxiosRequestHeaders & {
    [key: string]: string | number | boolean;
  };
}

// Define a type for the expected structure of ABDM API error responses
interface AbdmErrorData {
  error?: {
    code?: string;
    message?: string;
    details?: APIErrorDetails[];
  };
  code?: string;
  message?: string;
  details?: APIErrorDetails[];
}

export class HttpClient {
  private readonly client: AxiosInstance;
  public readonly config: ABDMConfig;
  private _authToken: string | null = null;
  private _tokenExpiry: Date | null = null;
  private _publicKey: string | null = null;

  public get publicKey(): string | null {
    return this._publicKey;
  }

  public set publicKey(key: string | null) {
    this._publicKey = key;
  }

  public get authToken(): string | null {
    return this._authToken;
  }

  public set authToken(token: string | null) {
    this._authToken = token;
  }

  public get tokenExpiry(): Date | null {
    return this._tokenExpiry;
  }

  public set tokenExpiry(expiry: Date | null) {
    this._tokenExpiry = expiry;
  }

  constructor(config: ABDMConfig) {
    this.config = {
      ...config,
      basePath: config.basePath || 'https://dev.abdm.gov.in/gateway',
      useSandbox: config.useSandbox !== false, // Default to true
      timeout: config.timeout || 30000,
    };

    this.client = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Add a request interceptor to manage authentication tokens
    this.client.interceptors.request.use(
      async (axiosConfig: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const internalConfig = axiosConfig as CustomAxiosRequestConfig;
        const authPathSegment = '/v0.5/sessions';

        // Do not add auth token for session creation requests
        if (internalConfig.url?.includes(authPathSegment)) {
          return internalConfig;
        }

        let currentToken = internalConfig.authToken || this._authToken;

        // Check if the token is expired
        if (currentToken && this._tokenExpiry && new Date() >= this._tokenExpiry) {
          currentToken = null; // Token is expired
        }

        // If no token, try to authenticate
        if (!currentToken && this.config.clientId && this.config.clientSecret) {
          try {
            await this.authenticate();
            currentToken = this._authToken;
          } catch (error) {
            console.error('Failed to re-authenticate during request:', error);
            // Do not throw here, let the request fail with 401
          }
        }

        // Add Authorization header if a token exists
        if (currentToken) {
          internalConfig.headers.Authorization = `Bearer ${currentToken}`;
        }

        return internalConfig;
      },
      (error: unknown) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticates with ABDM and stores the access token and its expiry.
   */
  public async authenticate(): Promise<void> {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('Client ID and Client Secret are required for authentication.');
    }
    try {
      const authUrl = `${this.config.basePath}/v0.5/sessions`;
      const authString = Buffer.from(
        `${this.config.clientId}:${this.config.clientSecret}`
      ).toString('base64');

      const response = await axios.post(
        authUrl,
        { grantType: 'client_credentials' }, // Added grantType as per spec
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authString}`,
            'X-CM-ID': this.config.xcmId || 'sbx',
          },
        }
      );

      const { accessToken, expiresIn } = response.data;
      if (!accessToken) {
        throw new Error('No access token received in response');
      }

      this._authToken = accessToken;
      // Set expiry with a 5-minute buffer
      this._tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
    } catch (error: unknown) {
      let errorMessage: string;
      if (axios.isAxiosError(error)) {
        errorMessage =
          error.response?.data?.error?.message || error.message || 'Unknown authentication error';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unexpected error occurred during authentication.';
      }
      console.error('ABDM Authentication Error:', error);
      throw new Error(`Authentication failed: ${errorMessage}`);
    }
  }

  /**
   * Encrypts data using the ABDM public key.
   * @param data The string data to encrypt.
   * @returns The Base64-encoded encrypted string.
   */
  public encrypt(data: string): string {
    if (!this._publicKey) {
      throw new Error('Public key is not set. Cannot encrypt data.');
    }
    try {
      const buffer = Buffer.from(data, 'utf8');
      const encrypted = crypto.publicEncrypt(
        {
          key: this._publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        },
        buffer
      );
      return encrypted.toString('base64');
    } catch (error: unknown) {
      console.error('Encryption failed:', error);
      if (error instanceof Error) {
        throw new Error(`Encryption failed: ${error.message}`);
      }
      throw new Error('An unknown error occurred during encryption.');
    }
  }

  /**
   * The core request method for all HTTP calls.
   * @param method The HTTP method (e.g., GET, POST, PUT, DELETE).
   * @param url The URL for the request.
   * @param data The request data (if applicable).
   * @param options Custom request options.
   * @returns A standardized APIResponse object.
   */
  private normalizeError(error: AxiosError<APIResponse<any>>): {
    code: string;
    message: string;
    details?: APIErrorDetails[];
  } {
    const response = error.response?.data;
    const errorData: AbdmErrorData = response?.error || response || {};

    return {
      code: errorData.code || errorData.error?.code || 'UNKNOWN_ERROR',
      message: errorData.message || errorData.error?.message || error.message,
      details: errorData.details || errorData.error?.details,
    };
  }

  private async request<T = any>(
    method: string,
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<APIResponse<T>> {
    const { authToken, headers = {}, ...rest } = options;
    const requestId = crypto.randomUUID();

    // Prepare the request config
    const config: CustomAxiosRequestConfig = {
      method,
      url,
      data,
      headers: {
        ...headers,
      } as AxiosRequestHeaders,
      ...rest,
    };

    // Log the request
    logger.debug({
      requestId,
      method,
      url,
      headers: config.headers,
      data: data ? '*** REDACTED ***' : undefined,
    }, 'Sending HTTP request');

    // Add auth token if provided
    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await this.client.request<APIResponse<T>>(config);

      // Log successful response
      logger.debug({
        requestId,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data ? '*** REDACTED ***' : undefined,
      }, 'Received HTTP response');

      return response.data;
    } catch (error) {
      // Log error response
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<APIResponse<any>>;
        const errorData = this.normalizeError(axiosError);

        logger.error({
          requestId,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          error: errorData,
          responseHeaders: axiosError.response?.headers,
          responseData: axiosError.response?.data ? '*** REDACTED ***' : undefined,
        }, 'HTTP request failed');

        throw new Error(
          errorData.message || 'An unknown error occurred'
        );
      }

      // Handle non-Axios errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error({
        requestId,
        error: errorMessage,
        stack: errorStack,
      }, 'Non-HTTP error occurred');

      throw error;
    }
    }
  }

  // --- HTTP Method Helpers ---

  public get<T>(path: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'GET', url: path }, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public post<T>(path: string, data: any, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'POST', url: path, data }, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public put<T>(path: string, data: any, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'PUT', url: path, data }, options);
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'DELETE', url: path }, options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public patch<T>(path: string, data: any, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>({ method: 'PATCH', url: path, data }, options);
  }
}
