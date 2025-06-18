import * as crypto from 'crypto';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import { APIResponse } from '../types';

// Extend AxiosRequestConfig with our custom options
export interface RequestOptions extends Omit<AxiosRequestConfig, 'data'> {
  /**
   * Whether to cache the response
   * - `false`: No caching (default)
   * `true`: Cache with default TTL (5 minutes)
   * `number`: Cache with custom TTL in seconds
   */
  cache?: boolean | number;
  
  /**
   * Whether to retry the request on failure
   * - `false`: No retries
   * `true`: Use default retry settings (3 retries)
   * `number`: Maximum number of retries
   */
  retry?: boolean | number;
  
  /**
   * Whether to skip authentication
   * @default false
   */
  skipAuth?: boolean;
  
  // Allow any data type
  data?: any;
}

// Extend the APIResponse interface to include our custom fields
interface ExtendedAPIResponse<T = any> extends APIResponse<T> {
  /** HTTP status code */
  statusCode?: number;
  /** Response headers */
  headers?: Record<string, any>;
  /** Whether the response was served from cache */
  cached?: boolean;
}

import type { ABDMConfig } from '../types';
import { logger } from './logger';

// Default configuration
const DEFAULT_CONFIG = {
  // Default cache TTL in seconds (5 minutes)
  cacheTtl: 300,
  // Default timeout in milliseconds (30 seconds)
  timeout: 30000,
  // Default retry settings
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
  }
} as const;

// Define a custom request config that includes our custom properties
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  requestId?: string;
  skipAuth?: boolean;
  retryCount?: number;
  [key: string]: any; // Allow additional properties
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
  error: string;
  error_description: string;
  timestamp?: string;
  path?: string;
  code?: string;
  message?: string;
  details?: any[];
  [key: string]: any; // Allow additional properties
}

export class HttpClient {
  private readonly client: AxiosInstance;
  public readonly config: ABDMConfig;
  private _authToken: string | null = null;
  private _tokenExpiry: Date | null = null;
  private _publicKey: string | null = null;
  private _privateKey: string | null = null;
  private _keyId: string | null = null;
  // Cache and retry configuration
  private _cache: NodeCache;
  private _defaultCacheTtl: number;
  private _defaultRetryConfig: {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
  };

  /**
   * Get a cached response if available
   * @param key The cache key
   */
  private getCachedResponse<T>(key: string): T | undefined {
    return this._cache.get<T>(key);
  }

  /**
   * Set a response in the cache
   * @param key The cache key
   * @param data The data to cache
   * @param ttl Time to live in seconds (default: 5 minutes)
   */
  private setCachedResponse<T>(key: string, data: T, ttl: number = this._defaultCacheTtl): void {
    this._cache.set(key, data, ttl);
  }

  /**
   * Generate a cache key from request config
   * @param config The Axios request config
   * @returns A unique cache key string
   */
  private generateCacheKey(config: AxiosRequestConfig): string {
    const { method, url, params, data } = config;
    const keyParts = [
      method?.toUpperCase(),
      url,
      params ? JSON.stringify(params) : '',
      data && typeof data === 'object' ? JSON.stringify(data) : String(data || '')
    ];
    
    // Create a hash of the key parts to ensure it's a valid cache key
    const keyString = keyParts.join('|');
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Execute a request with retry logic
   * @param config The Axios request config
   * @param retryCount The current retry attempt count
   * @returns A promise that resolves to the Axios response
   */
  private async executeWithRetry<T>(
    config: RequestOptions,
    retryCount = 0
  ): Promise<AxiosResponse<T>> {
    const requestId = config.headers?.['X-Request-ID'] as string || 'unknown';
    
    // Determine retry configuration
    const retryConfig = typeof config.retry === 'object' ? config.retry : this._defaultRetryConfig;
    const maxRetries = typeof config.retry === 'number' 
      ? config.retry 
      : config.retry === false ? 0 : retryConfig.maxRetries;
    
    try {
      const response = await this.client.request<T>({
        ...config,
        timeout: config.timeout ?? this.config.timeout ?? DEFAULT_CONFIG.timeout,
      });

      return response;
      
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Log the error
      if (axiosError.response) {
        logger.error(`[${requestId}] Request failed with status ${axiosError.response.status}: ${axiosError.message}`);
      } else {
        logger.error(`[${requestId}] Request failed: ${axiosError.message}`);
      }
      
      // Don't retry on 4xx errors except 429 (Too Many Requests)
      if (axiosError.response?.status && 
          axiosError.response.status >= 400 && 
          axiosError.response.status < 500 &&
          axiosError.response.status !== 429) {
        throw error;
      }

      // Max retries reached
      if (retryCount >= maxRetries) {
        logger.warn(`[${requestId}] Max retries (${maxRetries}) reached, giving up`);
        throw error;
      }

      // Calculate exponential backoff with jitter
      const baseDelay = Math.min(
        retryConfig.initialDelay * Math.pow(2, retryCount),
        retryConfig.maxDelay
      );
      
      const jitter = Math.random() * 1000; // Add up to 1s jitter
      const delay = Math.min(baseDelay + jitter, retryConfig.maxDelay);
      
      logger.debug(`[${requestId}] Retrying in ${Math.round(delay)}ms (attempt ${retryCount + 1}/${maxRetries})...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.executeWithRetry<T>(config, retryCount + 1);
    }
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
   * @param publicKey The public key as a string or null to clear it
   */
  public set publicKey(publicKey: string | null) {
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

  /**
   * Get a copy of the current configuration
   */
  public getConfig(): ABDMConfig {
    return { ...this.config };
  }

  /**
   * Builds a full URL based on the service type and path
   * @param path The API endpoint path (e.g., '/v3/sessions')
   * @param serviceType The type of service ('auth' | 'gateway' | 'default')
   * @returns The full URL
   */
  private buildUrl(path: string, serviceType: 'auth' | 'gateway' | 'default' = 'default'): string {
    // If the path is already a full URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Determine the base URL based on service type
    let baseUrl: string;
    switch (serviceType) {
      case 'auth':
        baseUrl = this.config.authBaseUrl || this.config.baseUrl || '';
        break;
      case 'gateway':
        baseUrl = this.config.gatewayBaseUrl || this.config.baseUrl || '';
        break;
      default:
        baseUrl = this.config.baseUrl || '';
    }
    
    // Remove trailing slashes from baseUrl
    baseUrl = baseUrl.replace(/\/+$/, '');
    
    // Ensure path doesn't start with a slash if baseUrl ends with one
    const normalizedPath = path.startsWith('/') && baseUrl.endsWith('/') 
      ? path.substring(1) 
      : path;
    
    // Handle version in path for gateway requests
    let finalPath = normalizedPath;
    if (serviceType === 'gateway' && normalizedPath.includes('/v3/')) {
      finalPath = normalizedPath.replace('/v3/', '/v0.5/');
    }
    
    // Combine baseUrl and path, ensuring no double slashes
    return `${baseUrl}${baseUrl && !baseUrl.endsWith('/') ? '/' : ''}${finalPath}`.replace(/([^:]\/)\/+/g, '$1');
  }

  constructor(config: ABDMConfig) {
    // Initialize cache with default TTL of 5 minutes and check period of 1 minute
    this._defaultCacheTtl = DEFAULT_CONFIG.cacheTtl;
    this._defaultRetryConfig = {
      maxRetries: DEFAULT_CONFIG.retry.maxRetries,
      initialDelay: DEFAULT_CONFIG.retry.initialDelay,
      maxDelay: DEFAULT_CONFIG.retry.maxDelay,
    };

    // Initialize the cache with proper configuration
    this._cache = new NodeCache({
      stdTTL: this._defaultCacheTtl,
      checkperiod: 60,
      useClones: false
    });
    
    // Initialize the Axios instance with the provided config
    this.config = config;
    this.client = axios.create({
      timeout: config.timeout || DEFAULT_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      }
    });

    // Set up interceptors
    this._setupRequestInterceptors();
    this._setupResponseInterceptors();
    
    // Initialize the Axios instance with the provided config
    this.config = config;
    this.client = axios.create({
      timeout: config.timeout || DEFAULT_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers
      }
    });
    
    // Set default values if not provided
    const isSandbox = config.useSandbox !== false;
    
    this.config = {
      ...config,
      // Default to sandbox if not specified
      useSandbox: isSandbox,
      // Set default timeout if not provided
      timeout: config.timeout || 30000,
      // Set base URLs based on environment
      baseUrl: isSandbox 
        ? (config.sandboxBaseUrl || 'https://abdm.abdm.gov.in')
        : (config.baseUrl || 'https://abdm.gov.in'),
      // Set auth base URL
      authBaseUrl: isSandbox 
        ? (config.sandboxAuthBaseUrl || 'https://dev.abdm.gov.in/gateway')
        : (config.authBaseUrl || config.baseUrl || 'https://abdm.gov.in'),
      // Set gateway base URL
      gatewayBaseUrl: isSandbox
        ? (config.sandboxGatewayUrl || 'https://dev.abdm.gov.in/gateway')
        : (config.gatewayBaseUrl || config.baseUrl || 'https://abdm.gov.in'),
    };
    
    // Log the configuration
    logger.debug('ABDM Client Configuration:', {
      useSandbox: this.config.useSandbox,
      baseUrl: this.config.baseUrl,
      authBaseUrl: this.config.authBaseUrl,
      gatewayBaseUrl: this.config.gatewayBaseUrl,
      xcmId: this.config.xcmId,
    });

    // Set public key from config if provided
    if (config.publicKey) {
      this._publicKey = config.publicKey;
    }

    // Initialize the Axios client with the base URL and SSL settings
    const httpsAgent = new (require('https').Agent)({ 
      rejectUnauthorized: false, // Only for sandbox, should be true in production
      keepAlive: true,
      timeout: this.config.timeout,
    });

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CM-ID': this.config.xcmId || 'sbx',
        ...(config.headers || {}),
      },
      maxRedirects: 5,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    
    // Add debug logging for SSL/TLS issues
    (process.env as any).NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Only for sandbox, remove in production
    require('https').globalAgent.options.rejectUnauthorized = false; // Only for sandbox, remove in production

    // Add request interceptor for authentication and logging
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const internalConfig = config as CustomAxiosRequestConfig;
        const requestId = Math.random().toString(36).substring(2, 8);
        internalConfig['requestId'] = requestId;
        internalConfig['timestamp'] = Date.now();

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

        // Skip auth for authentication requests to prevent infinite loops
        const isAuthRequest = internalConfig.url?.includes('/v3/sessions') || 
                            internalConfig.url?.includes('/v0.5/sessions') ||
                            internalConfig.url?.includes('/hiecm/gateway/v3/sessions');
        
        if (isAuthRequest) {
          logger.debug(`[${requestId}] Auth request - skipping auth interceptor`);
          return config;
        }

        let currentToken = internalConfig['authToken'] || this._authToken;

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

        // Add common headers with proper timestamp format
        const timestamp = new Date();
        const formattedTimestamp = timestamp.toISOString();
        
        Object.assign(internalConfig.headers, {
          'X-CM-ID': this.config['xcmId'] || 'sbx',
          'X-Request-ID': requestId,
          'X-Timestamp': formattedTimestamp,
          'Date': timestamp.toUTCString()
        });
        
        // Log the timestamp being sent
        logger.debug(`[${requestId}] Using timestamp: ${formattedTimestamp}`);
        
        // Add Authorization header if we have a token
        if (currentToken) {
          internalConfig.headers.Authorization = `Bearer ${currentToken}`;
        }
        
        logger.debug(`[${requestId}] Added common headers`);

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set up request interceptors for authentication and logging
   */
  private _setupRequestInterceptors(): void {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const requestId = Math.random().toString(36).substring(2, 10);
        const internalConfig = config as CustomAxiosRequestConfig;
        internalConfig['requestId'] = requestId;
        internalConfig['timestamp'] = Date.now();

        // Log the request
        logger.debug(`[${requestId}] ${config.method?.toUpperCase()} ${config.url}`);
        
        // Add auth token if available and not explicitly skipped
        if (this._authToken && !internalConfig['skipAuth']) {
          internalConfig.headers = internalConfig.headers || {};
          internalConfig.headers['Authorization'] = `Bearer ${this._authToken}`;
        }
        
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set up response interceptors for error handling and logging
   */
  private _setupResponseInterceptors(): void {
    this.client.interceptors.response.use(
      (response) => {
        const requestId = (response.config as any).requestId || 'unknown';
        logger.debug(`[${requestId}] ${response.status} ${response.statusText}`);
        return response;
      },
      async (error: AxiosError<AbdmErrorData>) => {
        const requestId = (error.config as any)?.requestId || 'unknown';
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          logger.error(`[${requestId}] Request failed with status ${error.response.status}:`, 
            error.response.data);
        } else if (error.request) {
          // The request was made but no response was received
          logger.error(`[${requestId}] No response received:`, error.message);
        } else {
          // Something happened in setting up the request that triggered an Error
          logger.error(`[${requestId}] Request setup error:`, error.message);
        }
        
        const originalRequest = error.config as CustomAxiosRequestConfig;
        
        // If the error is 401 and we haven't already tried to refresh the token
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            await this.authenticate();
            
            // Retry the original request with the new token
            if (this._authToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers['Authorization'] = `Bearer ${this._authToken}`;
              return this.client(originalRequest);
            }
          } catch (err) {
            // If refresh token fails, clear auth and reject
            this._authToken = null;
            return Promise.reject(err);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticates with ABDM and returns the access token.
   * @param maxRetries Maximum number of retry attempts (default: 3)
   * @param retryDelay Delay between retries in milliseconds (default: 1000)
   */
  public async authenticate(maxRetries: number = 3, retryDelay: number = 1000): Promise<string> {
    const requestId = Math.random().toString(36).substring(2, 8);
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      logger.debug(`[${requestId}] Starting authentication attempt ${attempt}/${maxRetries}...`);
      
      if (!this.config.clientId || !this.config.clientSecret) {
        const errorMsg = 'Client ID and Client Secret are required for authentication';
        logger.error(`[${requestId}] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      const requestData = {
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        grantType: 'client_credentials'
      };

      try {
        logger.debug(`[${requestId}] Sending authentication request to auth service`);
        
        // For sandbox, use the direct URL to avoid path issues
        const authUrl = this.config.useSandbox !== false 
          ? 'https://dev.abdm.gov.in/gateway/v0.5/sessions'
          : this.buildUrl('/v3/sessions', 'auth');
          
        logger.debug(`[${requestId}] Using auth URL: ${authUrl}`);
        
        // Create a new axios instance just for authentication to avoid interceptors
        const authClient = axios.create({
          baseURL: '', // We'll use the full URL in the request
          timeout: this.config.timeout || 30000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CM-ID': this.config.xcmId || 'sbx',
            'REQUEST-ID': requestId,
            'TIMESTAMP': new Date().toISOString()
          }
        });

        // Log the request details
        logger.debug(`[${requestId}] Auth request details`, {
          url: authUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CM-ID': this.config.xcmId || 'sbx',
            'REQUEST-ID': requestId,
            'TIMESTAMP': new Date().toISOString()
          },
          data: {
            clientId: requestData.clientId,
            grantType: requestData.grantType,
            clientSecret: '***' // Don't log the actual secret
          }
        });

        // Make the authentication request
        logger.debug(`[${requestId}] Sending request to: ${authUrl}`);
        const response = await authClient.post<AuthResponse>(authUrl, requestData);
        
        // Log successful response (without sensitive data)
        logger.debug(`[${requestId}] Auth response received`, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data ? {
            ...response.data,
            accessToken: response.data.accessToken ? '***' : undefined
          } : undefined
        });

        if (!response.data?.accessToken) {
          const errorMsg = 'No access token received in authentication response';
          logger.error(`[${requestId}] ${errorMsg}`, { 
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data 
          });
          throw new Error(errorMsg);
        }

        // Store the token and calculate expiry
        this._authToken = response.data.accessToken;
        this._tokenExpiry = new Date(Date.now() + ((response.data.expiresIn || 1199) * 1000));
        
        logger.debug(`[${requestId}] Authentication successful. Token expires at: ${this._tokenExpiry.toISOString()}`);
        
        return this._authToken;
      } catch (error: any) {
        // Extract error details
        const errorResponse = error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data
        } : undefined;
        
        const errorConfig = error.config ? {
          url: error.config.url,
          method: error.config.method,
          headers: {
            ...error.config.headers,
            'X-CM-ID': '***',
            'clientSecret': '***',
            'REQUEST-ID': error.config.headers?.['REQUEST-ID'],
            'TIMESTAMP': error.config.headers?.['TIMESTAMP']
          },
          data: error.config.data ? '***' : undefined,
          baseURL: error.config.baseURL
        } : undefined;
        
        // Prepare error details for logging
        const errorDetails: Record<string, any> = {
          message: error.message,
          code: error.code,
          stack: error.stack,
          isAxiosError: error.isAxiosError,
          config: errorConfig,
          response: errorResponse
        };
        
        // Log the full error details for debugging
        logger.error(`[${requestId}] Authentication attempt ${attempt} failed with error:`, errorDetails);
        
        // Create a more descriptive error message
        let errorMessage = `Authentication attempt ${attempt} failed`;
        
        if (errorResponse) {
          errorMessage += ` with status ${errorResponse.status} ${errorResponse.statusText}`;
          
          // Add more details from the response if available
          if (errorResponse.data) {
            if (typeof errorResponse.data === 'object') {
              errorMessage += ` - ${JSON.stringify(errorResponse.data)}`;
            } else {
              errorMessage += ` - ${errorResponse.data}`;
            }
          }
        } else if (error.request) {
          errorMessage += `: No response received from server`;
          if (error.code) errorMessage += ` (${error.code})`;
        } else {
          errorMessage += `: ${error.message}`;
        }
        
        lastError = new Error(errorMessage);
        
        // If we get a 401, there's no point in retrying with the same credentials
        if (errorResponse?.status === 401) {
          logger.error(`[${requestId}] Invalid credentials. Stopping retries.`);
          break;
        }
      }
      
      // If we've exhausted all retry attempts, throw the last error
      if (attempt === maxRetries) {
        logger.error(`[${requestId}] All ${maxRetries} authentication attempts failed`);
        throw lastError || new Error('Authentication failed after all retry attempts');
      }
      
      // Wait before retrying
      logger.debug(`[${requestId}] Waiting ${retryDelay}ms before next retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw new Error('Authentication failed after all retry attempts');
  }
  


  /**
   * Fetches the public key from the ABDM server.
   * @returns A promise that resolves to the public key or null if not found
   */
  public async getPublicKey(): Promise<{ key: string } | null> {
    try {
      // Get or refresh the authentication token
      let authToken = this.getAuthToken();
      if (!authToken) {
        await this.authenticate();
        authToken = this.getAuthToken();
        if (!authToken) {
          throw new Error('Authentication failed - no token received');
        }
      }
      
      const isSandbox = this.config.useSandbox !== false;
      const endpoint = '/v1/auth/cert';
      
      if (isSandbox) {
        // Handle sandbox environment with direct axios call
        const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;
        const baseUrl = this.config.sandboxAuthBaseUrl || this.config.urls?.sandbox?.authBaseUrl || 'https://healthidsbx.abdm.gov.in/api';
        const response = await axios.get(`${baseUrl}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-CM-ID': this.config.xcmId || 'sbx',
            'X-Token': token
          },
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });
        
        // Extract and return the public key from the response
        const result = this.extractPublicKeyFromResponse(response.data);
        if (!result) {
          throw new Error('No valid public key found in the response');
        }
        return result;
      } else {
        // Handle production environment using the internal get method
        const response = await this.get<{ key?: string; publicKey?: string; public_key?: string }>(
          endpoint, 
          {},
          'auth'  // Use 'auth' service type for production
        );
        
        // Check if the request was successful
        if (response.status !== 'SUCCESS' || !response.data) {
          const errorMessage = response.error?.message || 'Unknown error';
          const errorCode = response.error?.code || 'UNKNOWN_ERROR';
          throw new Error(`Failed to fetch public key [${errorCode}]: ${errorMessage}`);
        }
        
        // Extract and return the public key from the response
        const result = this.extractPublicKeyFromResponse(response.data);
        if (!result) {
          throw new Error('No valid public key found in the response');
        }
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error in getPublicKey:', error);
      throw new Error(`Failed to fetch public key: ${errorMessage}`);
    }
  }
  
  /**
   * Extracts public key from various response formats
   * @private
   */
  private extractPublicKeyFromResponse(data: any): { key: string } | null {
    if (!data) return null;
    
    let publicKey: string | null = null;
    
    if (typeof data === 'string') {
      publicKey = data;
    } else if (data.key) {
      publicKey = data.key;
    } else if (data.publicKey) {
      publicKey = data.publicKey;
    } else if (data.public_key) {
      publicKey = data.public_key;
    } else if (typeof data === 'object') {
      // Try to find the key in the response object
      const jsonString = JSON.stringify(data);
      const keyMatch = jsonString.match(/"(?:key|public_key|publicKey)":"([^"]+)"/i);
      if (keyMatch && keyMatch[1]) {
        publicKey = keyMatch[1];
      }
    }
    
    if (publicKey) {
      // Ensure the key is properly formatted
      if (!publicKey.includes('-----BEGIN PUBLIC KEY-----')) {
        publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
      }
      this._publicKey = publicKey;
      return { key: publicKey };
    }
    
    return null;
  }

  /**
   * Encrypts data using the ABDM public key.
   * @param data The string data to encrypt.
   * @returns The Base64-encoded encrypted string.
   * @throws {Error} If encryption fails or public key is not available
   */
  public async encrypt(data: string): Promise<string> {
    try {
      // For production, try to get the public key from the configuration first
      if (!this._publicKey) {
        const publicKeyResponse = await this.getPublicKey();
        if (!publicKeyResponse) {
          throw new Error('Failed to obtain public key for encryption');
        }
        this._publicKey = publicKeyResponse.key;
      }
      
      const buffer = Buffer.from(data, 'utf8');
      const encrypted = crypto.publicEncrypt(
        {
          key: this._publicKey!,
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
   * The main request method that handles all HTTP requests
   * @param config The request configuration
   * @param serviceType The type of service to determine which base URL to use
   * @returns A promise that resolves to the API response
   */
  private async request<T>(
    config: RequestOptions,
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    const requestId = Math.random().toString(36).substring(2, 10);
    const startTime = Date.now();
    
    // Build the full URL
    const url = config.url || '';
    const requestUrl = this.buildUrl(url, serviceType);
    
    // Generate cache key if caching is enabled
    const cacheKey = config.cache ? this.generateCacheKey({ ...config, url: requestUrl }) : '';
    
    // Check cache if enabled for GET requests
    if (config.cache && config.method?.toUpperCase() === 'GET') {
      const cachedResponse = this.getCachedResponse<T>(cacheKey);
      if (cachedResponse) {
        logger.debug(`[${requestId}] Returning cached response for ${requestUrl}`);
        return {
          status: 'SUCCESS',
          data: cachedResponse,
          cached: true,
          statusCode: 200,
          headers: {}
        } as ExtendedAPIResponse<T>;
      }
    }
    
    // Prepare request config
    const requestConfig: RequestOptions = {
      ...config,
      url: requestUrl,
      headers: {
        ...config.headers,
        'X-Request-ID': requestId,
        'X-Timestamp': new Date().toISOString(),
      },
    };
    
    try {
      // Execute request with retry logic if enabled
      const response = await this.executeWithRetry<T>(requestConfig);
      
      // Cache the response if enabled and successful
      if (config.cache && config.method?.toUpperCase() === 'GET' && response.status === 200) {
        const cacheTtl = typeof config.cache === 'number' ? config.cache : this._defaultCacheTtl;
        this.setCachedResponse(cacheKey, response.data, cacheTtl);
      }
      
      const duration = Date.now() - startTime;
      logger.debug(`[${requestId}] === REQUEST COMPLETED (${duration}ms) ===`);
      
      return {
        status: 'SUCCESS',
        data: response.data,
        statusCode: response.status,
        headers: response.headers
      } as ExtendedAPIResponse<T>;
      
    } catch (error) {
      const axiosError = error as AxiosError<APIResponse<T>>;
      logger.error(`[${requestId}] Request failed:`, axiosError.message);
      
      // Normalize the error response
      if (axiosError.response) {
        return {
          status: 'ERROR',
          error: {
            code: axiosError.response.status.toString(),
            message: axiosError.response.statusText,
            details: axiosError.response.data
          },
          statusCode: axiosError.response.status,
          headers: axiosError.response.headers
        } as ExtendedAPIResponse<T>;
      }
      
      // For network errors or timeouts
      return {
        status: 'ERROR',
        error: {
          code: 'NETWORK_ERROR',
          message: axiosError.message || 'Network request failed'
        }
      } as ExtendedAPIResponse<T>;
    }
  }

  // --- HTTP Method Helpers ---

  /**
   * Send a GET request
   * @param url The URL to send the request to
   * @param config Optional request config with additional options
   * @param serviceType The type of service to determine which base URL to use (default: 'default')
   * @returns A promise that resolves to the API response
   */
  public async get<T>(
    url: string, 
    config: RequestOptions = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url }, serviceType);
  }

  /**
   * Send a POST request
   * @param url The URL to send the request to
   * @param data The data to send in the request body
   * @param config Optional request config with additional options
   * @param serviceType The type of service to determine which base URL to use (default: 'default')
   * @returns A promise that resolves to the API response
   */
  public async post<T>(
    url: string, 
    data?: any, 
    config: RequestOptions = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data }, serviceType);
  }

  /**
   * Send a PUT request
   * @param url The URL to send the request to
   * @param data The data to send in the request body
   * @param config Optional request config with additional options
   * @param serviceType The type of service to determine which base URL to use (default: 'default')
   * @returns A promise that resolves to the API response
   */
  public async put<T>(
    url: string, 
    data?: any, 
    config: RequestOptions = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data }, serviceType);
  }

  /**
   * Send a DELETE request
   * @param url The URL to send the request to
   * @param config Optional request config with additional options
   * @param serviceType The type of service to determine which base URL to use (default: 'default')
   * @returns A promise that resolves to the API response
   */
  public async delete<T>(
    url: string, 
    config: RequestOptions = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url }, serviceType);
  }

  /**
   * Send a PATCH request
   * @param url The URL to send the request to
   * @param data The data to send in the request body
   * @param config Optional request config with additional options
   * @param serviceType The type of service to determine which base URL to use (default: 'default')
   * @returns A promise that resolves to the API response
   */
  public async patch<T>(
    url: string, 
    data?: any, 
    config: RequestOptions = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data }, serviceType);
  }
}
