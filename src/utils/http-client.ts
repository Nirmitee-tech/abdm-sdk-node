import * as crypto from 'crypto';

import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import type { ABDMConfig, APIResponse } from '../types';

import { logger } from './logger';

// Define a custom request config that includes our authToken property
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  authToken?: string;
  requestId?: string;
  timestamp?: number;
  retryCount?: number;
}

interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
}

// Define a type for the expected structure of ABDM API error responses
interface AbdmErrorData {
  error?: {
    code?: string;
    message?: string;
    details?: any[];
  };
  code?: string;
  message?: string;
  details?: any[];
}

export class HttpClient {
  private readonly client: AxiosInstance;
  public readonly config: ABDMConfig;
  private _authToken: string | null = null;
  private _tokenExpiry: Date | null = null;
  private _publicKey: string | null = null;
  private _privateKey: string | null = null;
  private _keyId: string | null = null;

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
   * Get the token expiry time
   */
  public get tokenExpiry(): Date | null {
    return this._tokenExpiry;
  }

  /**
   * Set the token expiry time
   */
  public set tokenExpiry(expiry: Date | null) {
    this._tokenExpiry = expiry;
  }

  /**
   * Get the current authentication token (legacy method)
   */
  public getAuthToken(): string | null {
    return this.authToken;
  }

  /**
   * Set the authentication token (legacy method)
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  /**
   * Get the public key
   */
  public get publicKey(): string | null {
    return this._publicKey;
  }

  /**
   * Set the public key
   */
  public set publicKey(publicKey: string) {
    this._publicKey = publicKey;
  }

  /**
   * Get the private key
   */
  public get privateKey(): string | null {
    return this._privateKey;
  }

  /**
   * Set the private key
   */
  public set privateKey(privateKey: string) {
    this._privateKey = privateKey;
  }

  /**
   * Get the key ID
   */
  public get keyId(): string | null {
    return this._keyId;
  }

  /**
   * Set the key ID
   */
  public set keyId(keyId: string) {
    this._keyId = keyId;
  }

  constructor(config: ABDMConfig) {
    this.config = {
      ...config,
      baseURL: config.baseURL || 'https://dev.abdm.gov.in/gateway',
      useSandbox: config.useSandbox !== false, // Default to true
      timeout: config.timeout || 30000,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(config.headers || {}),
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const internalConfig = config as CustomAxiosRequestConfig;
        const authPathSegment = '/v0.5/sessions';

        // Skip auth for session creation requests
        if (internalConfig.url?.includes(authPathSegment)) {
          return config;
        }

        let currentToken = internalConfig.authToken || this._authToken;

        // Check if token is expired
        if (currentToken && this._tokenExpiry && new Date() >= this._tokenExpiry) {
          currentToken = null;
        }

        // Try to authenticate if no valid token
        if (!currentToken && this.config.clientId && this.config.clientSecret) {
          try {
            await this.authenticate();
            currentToken = this._authToken;
          } catch (error) {
            logger.error('Failed to re-authenticate during request:', error);
            // Continue without token, will fail with 401
          }
        }

        // Add Authorization header if we have a token
        if (currentToken) {
          internalConfig.headers.Authorization = `Bearer ${currentToken}`;
        }

        return config;
      },
      (error) => {
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
      const authUrl = `${this.config.baseURL || ''}/v0.5/sessions`;
      const authString = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await axios.post<AuthTokenResponse>(
        authUrl,
        { grantType: 'client_credentials' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authString}`,
            'X-CM-ID': (this.config as any).xcmId || 'sbx',
          },
        }
      );

      const { accessToken, expiresIn } = response.data;
      if (!accessToken) {
        throw new Error('No access token received in response');
      }

      this._authToken = accessToken;
      this._tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
    } catch (error: unknown) {
      let errorMessage: string;
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error?.message || error.message || 'Unknown authentication error';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unexpected error occurred during authentication.';
      }
      logger.error('ABDM Authentication Error:', error);
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
      logger.error('Encryption failed:', error);
      if (error instanceof Error) {
        throw new Error(`Encryption failed: ${error.message}`);
      }
      throw new Error('An unknown error occurred during encryption.');
    }
  }

  /**
   * The core request method for all HTTP calls.
   * @param config The Axios request config.
   * @returns A standardized APIResponse object.
   */
  private async request<T>(config: AxiosRequestConfig): Promise<APIResponse<T>> {
    try {
      const response = await this.client.request<APIResponse<T>>({
        ...config,
        headers: {
          ...config.headers,
          'X-Request-ID': uuidv4(),
          'X-Timestamp': new Date().toISOString(),
        },
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw this.normalizeError(error);
      }
      throw error;
    }
  }

  /**
   * Normalize error response from Axios.
   * @param error The Axios error.
   * @returns A standardized error object.
   */
  private normalizeError(error: AxiosError<APIResponse<any>>): Error {
    const response = error.response?.data;
    const errorData: AbdmErrorData = (response as any)?.error || response || {};

    const errorMessage = errorData.message || errorData.error?.message || error.message;
    const errorCode = errorData.code || errorData.error?.code || 'UNKNOWN_ERROR';

    const normalizedError = new Error(`[${errorCode}] ${errorMessage}`) as any;
    normalizedError.code = errorCode;
    normalizedError.details = errorData.details || errorData.error?.details;

    if (error.response?.status) {
      normalizedError.status = error.response.status;
    }

    return normalizedError;
  }

  // --- HTTP Method Helpers ---

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }
}
