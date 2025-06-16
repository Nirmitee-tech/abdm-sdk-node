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

// Define interfaces for API responses
interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  refreshToken: string;
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
      baseUrl: config.baseUrl || 'https://dev.abdm.gov.in/gateway',
      useSandbox: config.useSandbox !== false, // Default to true
      timeout: config.timeout || 30000,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(config.headers || {}),
      },
    });

    // Add request interceptor for authentication and logging
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const internalConfig = config as CustomAxiosRequestConfig;
        const requestId = Math.random().toString(36).substring(2, 8);
        internalConfig.requestId = requestId;
        internalConfig.timestamp = Date.now();

        // Log the request details
        logger.debug(`[${requestId}] === REQUEST START ===`);
        logger.debug(`[${requestId}] ${config.method?.toUpperCase()} ${config.url}`);
        logger.debug(`[${requestId}] Headers:`, {
          ...config.headers,
          'Authorization': config.headers?.Authorization ? 'Bearer ***' : undefined,
        });
        
        if (config.data) {
          logger.debug(`[${requestId}] Request Data:`, config.data);
        }

        // Skip auth for session creation requests
        if (internalConfig.url?.includes('/hiecm/gateway/v3/sessions')) {
          logger.debug(`[${requestId}] Auth endpoint - skipping auth header`);
          return config;
        }

        let currentToken = internalConfig.authToken || this._authToken;

        // Check if token is expired
        if (currentToken && this._tokenExpiry) {
          if (new Date() >= this._tokenExpiry) {
            logger.debug(`[${requestId}] Token expired at ${this._tokenExpiry.toISOString()}`);
            currentToken = null;
          } else {
            logger.debug(`[${requestId}] Using existing token (expires at ${this._tokenExpiry.toISOString()})`);
          }
        }

        // Try to authenticate if no valid token
        if (!currentToken && this.config.clientId && this.config.clientSecret) {
          logger.debug(`[${requestId}] No valid token - attempting to authenticate...`);
          try {
            await this.authenticate();
            currentToken = this._authToken;
            logger.debug(`[${requestId}] Successfully authenticated`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`[${requestId}] Failed to re-authenticate during request: ${errorMessage}`);
            // Continue without token, will fail with 401
          }
        } else if (!currentToken) {
          logger.debug(`[${requestId}] No credentials available for authentication`);
        }

        // Add Authorization header if we have a token
        if (currentToken) {
          internalConfig.headers.Authorization = `Bearer ${currentToken}`;
          logger.debug(`[${requestId}] Added Authorization header`);
        } else {
          logger.debug(`[${requestId}] No Authorization header added`);
        }

        return config;
      },
      (error) => {
        const requestId = (error.config as CustomAxiosRequestConfig)?.requestId || 'unknown';
        logger.error(`[${requestId}] Request interceptor error:`, error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        const requestId = (response.config as CustomAxiosRequestConfig)?.requestId || 'unknown';
        const duration = Date.now() - ((response.config as CustomAxiosRequestConfig)?.timestamp || 0);
        
        logger.debug(`[${requestId}] === RESPONSE RECEIVED (${duration}ms) ===`);
        logger.debug(`[${requestId}] Status: ${response.status} ${response.statusText}`);
        logger.debug(`[${requestId}] Headers:`, response.headers);
        
        if (response.data) {
          logger.debug(`[${requestId}] Response Data:`, response.data);
        }
        
        return response;
      },
      (error) => {
        const requestId = (error.config as CustomAxiosRequestConfig)?.requestId || 'unknown';
        const duration = error.config ? (Date.now() - ((error.config as CustomAxiosRequestConfig)?.timestamp || 0)) : 0;
        
        logger.error(`[${requestId}] === REQUEST FAILED (${duration}ms) ===`);
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          logger.error(`[${requestId}] Error Status: ${error.response.status}`);
          logger.error(`[${requestId}] Error Headers:`, error.response.headers);
          logger.error(`[${requestId}] Error Data:`, error.response.data);
        } else if (error.request) {
          // The request was made but no response was received
          logger.error(`[${requestId}] No response received:`, error.request);
        } else {
          // Something happened in setting up the request that triggered an Error
          logger.error(`[${requestId}] Request setup error:`, error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticates with ABDM and returns the access token.
   * @param retryCount Number of times to retry on 202 Accepted (default: 3)
   * @param retryDelay Delay between retries in milliseconds (default: 1000)
   */
  public async authenticate(retryCount = 3, retryDelay = 1000): Promise<string> {
    const requestId = Math.random().toString(36).substring(2, 8);
    const startTime = Date.now();
    
    if (!this.config.clientId || !this.config.clientSecret) {
      const error = new Error('Client ID and Client Secret are required for authentication');
      logger.error(`[${requestId}] Authentication error: ${error.message}`);
      throw error;
    }

    // Log the config being used for authentication
    logger.debug(`[${requestId}] === AUTHENTICATION CONFIGURATION ===`);
    logger.debug(`[${requestId}] Base URL: ${this.config.baseUrl}`);
    logger.debug(`[${requestId}] Sandbox Mode: ${this.config.useSandbox}`);
    logger.debug(`[${requestId}] Timeout: ${this.config.timeout || 30000}ms`);
    logger.debug(`[${requestId}] Client ID: ${this.config.clientId ? '*** (set)' : 'undefined'}`);
    logger.debug(`[${requestId}] Client Secret: ${this.config.clientSecret ? '*** (set)' : 'undefined'}`);
    logger.debug(`[${requestId}] X-CM-ID: ${this.config.xcmId || 'sbx (default)'}`);

    // Use the v3 authentication endpoint for ABDM with the correct path
    // Remove the /gateway part from baseUrl and replace with /api
    const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl;
    const baseUrlWithoutGateway = base.replace('/gateway', '');
    const authUrl = `${baseUrlWithoutGateway}/api/hiecm/gateway/v3/sessions`;
    logger.debug(`[${requestId}] Authentication Endpoint: ${authUrl}`);

    // Prepare request data as JSON
    const requestData = {
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      grantType: 'client_credentials'
    };

    // Create a custom request config with proper typing
    const requestConfig: AxiosRequestConfig = {
      url: authUrl,
      method: 'POST',
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        'REQUEST-ID': requestId,
        'TIMESTAMP': new Date().toISOString(),
        'X-CM-ID': this.config.xcmId || 'sbx',
        'Accept': 'application/json'
      },
      timeout: this.config.timeout || 30000,
      transitional: {
        silentJSONParsing: false,
        forcedJSONParsing: true,
        clarifyTimeoutError: true
      }
    };
    
    let attempts = 0;
    let lastError: Error | null = null;
    let response: any = null;
    
    // Helper function to calculate delay with jitter
    const calculateDelay = (baseDelay: number, attempt: number): number => {
      const backoff = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 0.2 * backoff; // Add up to 20% jitter
      return Math.min(backoff + jitter, 30000); // Cap at 30 seconds
    };
    
    while (attempts < retryCount) {
      attempts++;
      const attemptStartTime = Date.now();
      
      try {
        logger.debug(`[${requestId}] Authentication attempt ${attempts}/${retryCount}...`);
        
        // Make the authentication request with detailed logging
        logger.debug(`[${requestId}] Sending authentication request to: ${authUrl}`);
        logger.debug(`[${requestId}] Request headers:`, {
          ...requestConfig.headers,
          'X-CLIENT-ID': this.config.clientId ? '***' : '(not set)',
          'X-TIMESTAMP': requestConfig.headers?.['TIMESTAMP']
        });
        
        try {
          response = await this.client.request({
            ...requestConfig,
            responseType: 'text',
            validateStatus: (status) => {
              // Accept both success (2xx) and 202 (Accepted) status codes
              const isValid = (status >= 200 && status < 300) || status === 202;
              logger.debug(`[${requestId}] Status validation for ${status}: ${isValid ? 'valid' : 'invalid'}`);
              return isValid;
            },
            // Add timeout for this specific request
            timeout: Math.min(this.config.timeout || 30000, 15000) // Cap at 15s for auth requests
          });
        } catch (requestError) {
          if (axios.isAxiosError(requestError)) {
            // Handle network errors and timeouts specifically
            if (requestError.code === 'ECONNABORTED') {
              throw new Error(`Request timed out after ${requestError.config?.timeout}ms`);
            }
            if (requestError.code === 'ECONNREFUSED') {
              throw new Error(`Connection refused to ${requestError.config?.url}`);
            }
          }
          throw requestError; // Re-throw for the outer catch to handle
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        
        logger.debug(`[${requestId}] Request completed in ${duration}ms`);
        logger.debug(`[${requestId}] Status: ${response.status} ${response.statusText}`);
        logger.debug(`[${requestId}] Headers:`, response.headers);
        
        // If we got a successful response with a token
        if (response.status >= 200 && response.status < 300) {
          let responseData: AuthResponse;
          
          try {
            // Try to parse the response data
            const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
            responseData = JSON.parse(responseText);
            
            if (responseData.accessToken) {
              // Store the token and expiry
              this._authToken = responseData.accessToken;
              this._tokenExpiry = new Date(Date.now() + ((responseData.expiresIn || 1199) * 1000));
              
              logger.debug(`[${requestId}] Authentication successful`);
              logger.debug(`[${requestId}] Token Type: ${responseData.tokenType}`);
              logger.debug(`[${requestId}] Expires In: ${responseData.expiresIn} seconds`);
              logger.debug(`[${requestId}] Token will expire at: ${this._tokenExpiry.toISOString()}`);
              
              return responseData.accessToken;
            }
            
            throw new Error('No access token in response');
            
          } catch (parseError) {
            const errorMsg = parseError instanceof Error 
              ? `Failed to parse authentication response: ${parseError.message}`
              : 'Failed to parse authentication response: Unknown error';
            throw new Error(errorMsg);
          }
        }
        
        // Handle 202 Accepted with retry
        if (response.status === 202) {
          const retryAfter = response.headers['retry-after'] 
            ? Math.max(1000, parseInt(response.headers['retry-after'], 10) * 1000) // Ensure minimum 1s
            : calculateDelay(retryDelay, attempts);
          
          const attemptDuration = Date.now() - attemptStartTime;
          logger.warn(`[${requestId}] Request accepted but not completed (202). Attempt ${attempts}/${retryCount} failed in ${attemptDuration}ms`);
          
          // Log response headers for debugging
          logger.debug(`[${requestId}] Response headers:`, response.headers);
          
          // Only retry if we have attempts left
          if (attempts < retryCount) {
            logger.info(`[${requestId}] Retrying in ${Math.round(retryAfter / 1000)}s...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter));
            continue;
          } else {
            throw new Error('Maximum retry attempts reached for 202 Accepted response');
          }
        }
        
        // If we get here, we have an unexpected status code
        throw new Error(`Authentication failed with status ${response.status}: ${response.statusText}`);
        
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Log detailed error information
        if (axios.isAxiosError(error) && error.response) {
          const errResponse = error.response;
          // Log detailed error information
          const errorDetails: Record<string, any> = {
            status: errResponse.status,
            statusText: errResponse.statusText,
            url: errResponse.config?.url,
            method: errResponse.config?.method?.toUpperCase(),
            headers: {
              ...errResponse.config?.headers,
              'X-CLIENT-ID': '***',
              'X-CLIENT-SECRET': '***',
              'Authorization': '***'
            }
          };
          
          logger.error(`[${requestId}] Authentication error (${attempts}/${retryCount}): ${errResponse.status} ${errResponse.statusText}`, errorDetails);
          
          // Try to extract and log error details from response
          if (errResponse.data) {
            try {
              const errorData = typeof errResponse.data === 'string' 
                ? JSON.parse(errResponse.data) 
                : errResponse.data;
              
              // Log error details in a more structured way
              const errorInfo = {
                error: errorData.error || 'Unknown error',
                message: errorData.message || 'No error message provided',
                code: errorData.code || 'no_error_code',
                details: errorData.details || []
              };
              
              logger.error(`[${requestId}] Error details:`, errorInfo);
              
              // If we have a 400/401 error with specific message, provide more context
              if ((errResponse.status === 400 || errResponse.status === 401) && errorData.message) {
                logger.error(`[${requestId}] Authentication failed: ${errorData.message}`);
                if (errorData.message.includes('invalid_client')) {
                  logger.error(`[${requestId}] Please verify your client_id and client_secret are correct`);
                }
              }
            } catch (e) {
              // If we can't parse the error, log the raw response
              const responsePreview = String(errResponse.data).substring(0, 500);
              logger.error(`[${requestId}] Raw error response (${responsePreview.length} chars):`, responsePreview);
              
              // If the response is HTML, it might be a proxy or gateway error page
              if (responsePreview.trim().toLowerCase().startsWith('<!doctype html>') || 
                  responsePreview.trim().toLowerCase().startsWith('<html>')) {
                logger.error(`[${requestId}] Received HTML response - this might indicate a proxy or gateway issue`);
              }
            }
          }
          
          // If we get a 401, there's no point in retrying with the same credentials
          if (errResponse.status === 401) {
            logger.error(`[${requestId}] Invalid credentials. Stopping retries.`);
            break;
          }
          
          // For rate limiting, use the Retry-After header if available
          if (errResponse.status === 429) {
            const retryAfter = errResponse.headers['retry-after'] 
              ? parseInt(errResponse.headers['retry-after'], 10) * 1000 
              : retryDelay * Math.pow(2, attempts);
            
            if (attempts < retryCount) {
              logger.warn(`[${requestId}] Rate limited. Waiting ${retryAfter}ms before retry (${attempts + 1}/${retryCount})...`);
              await new Promise(resolve => setTimeout(resolve, retryAfter));
              continue;
            }
          }
        } else {
          logger.error(`[${requestId}] Request error (${attempts}/${retryCount}):`, error);
        }
        
        // If we've exhausted all retries, break the loop
        if (attempts >= retryCount) {
          break;
        }
        
        // Exponential backoff for retries
        const delay = retryDelay * Math.pow(2, attempts - 1);
        logger.debug(`[${requestId}] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we get here, all retries have failed
    const errorMessage = lastError 
      ? `Authentication failed after ${retryCount} attempts: ${lastError.message}`
      : `Authentication failed after ${retryCount} attempts`;
      
    logger.error(`[${requestId}] ${errorMessage}`);
    throw new Error(errorMessage);
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
    const requestId = Math.random().toString(36).substring(2, 8);
    const startTime = Date.now();
    
    // Log the request details
    logger.debug(`[${requestId}] === STARTING REQUEST ===`);
    logger.debug(`[${requestId}] ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
    logger.debug(`[${requestId}] Headers:`, {
      ...config.headers,
      Authorization: config.headers?.Authorization ? 'Bearer ***' : undefined,
    });
    
    if (config.data) {
      logger.debug(`[${requestId}] Request Data:`, config.data);
    }
    
    try {
      const response = await this.client.request<APIResponse<T>>({
        ...config,
        headers: {
          ...config.headers,
          'X-Request-ID': uuidv4(),
          'X-Timestamp': new Date().toISOString(),
        },
      });
      
      const duration = Date.now() - startTime;
      logger.debug(`[${requestId}] === REQUEST COMPLETED (${duration}ms) ===`);
      logger.debug(`[${requestId}] Status: ${response.status} ${response.statusText}`);
      
      if (response.data) {
        logger.debug(`[${requestId}] Response Data:`, response.data);
      }
      
      return response.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      const axiosError = error as AxiosError<APIResponse<T>>;
      
      logger.error(`[${requestId}] === REQUEST FAILED (${duration}ms) ===`);
      
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        logger.error(`[${requestId}] Error Status: ${axiosError.response.status}`);
        logger.error(`[${requestId}] Error Headers:`, axiosError.response.headers);
        logger.error(`[${requestId}] Error Data:`, axiosError.response.data);
      } else if (axiosError.request) {
        // The request was made but no response was received
        logger.error(`[${requestId}] No response received:`, axiosError.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error(`[${requestId}] Request setup error:`, axiosError.message);
      }
      
      if (axios.isAxiosError(axiosError)) {
        throw this.normalizeError(axiosError);
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
