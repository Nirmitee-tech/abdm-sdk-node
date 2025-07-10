import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import { APIResponse } from '../types';
import { generateRequestId, getCurrentTimestamp, getCurrentTimestampMs } from './request-utils';
import * as crypto from 'crypto';
import * as semver from 'semver';
import { logger } from './logger';

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

/**
 * Converts a base64-encoded public key to PEM format for Node.js crypto
 */
function base64ToPem(base64Key: string): string {
  const cleanBase64 = base64Key.replace(/\s+/g, '');
  const lines = cleanBase64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

export class HttpClient {
  private static instance: AxiosInstance | null = null;
  private client: AxiosInstance;
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
    return keyString; // No crypto.createHash
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
    // Get or generate request ID
    const requestId = config.headers?.['REQUEST-ID'] as string || generateRequestId();
    const timestamp = getCurrentTimestamp();
    
    // Determine retry configuration
    const retryConfig = typeof config.retry === 'object' ? config.retry : this._defaultRetryConfig;
    const maxRetries = typeof config.retry === 'number' 
      ? config.retry 
      : config.retry === false ? 0 : retryConfig.maxRetries;
    
    try {
      // Prepare request config with common headers
      const requestConfig = {
        ...config,
        timeout: config.timeout ?? this.config.timeout ?? DEFAULT_CONFIG.timeout,
        headers: {
          ...config.headers,
          'REQUEST-ID': requestId,
          'TIMESTAMP': timestamp
        }
      };

      const response = await this.client.request<T>(requestConfig);
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
    // Node.js/OpenSSL version check
    const nodeVersion = process.versions.node;
    const opensslVersion = process.versions.openssl;
    const minNodeVersion = '16.0.0';
    if (!semver.satisfies(nodeVersion, `>=${minNodeVersion}`)) {
      logger.error(`ABDM SDK requires Node.js ${minNodeVersion} or higher. Detected: ${nodeVersion}`);
      throw new Error(`ABDM SDK requires Node.js ${minNodeVersion} or higher. Detected: ${nodeVersion}`);
    }
    // Warn if OpenSSL version is missing or too old
    if (!opensslVersion || !/^1\.|^3\./.test(opensslVersion)) {
      logger.warn(`ABDM SDK requires OpenSSL 1.x or 3.x. Detected: ${opensslVersion}`);
    }
    // Warn if insecure SSL settings are used in production
    if (process.env.NODE_ENV === 'production' && process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      logger.warn('Insecure SSL settings detected in production! Do not set NODE_TLS_REJECT_UNAUTHORIZED=0 in production.');
    }
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
    
    // Set default values if not provided
    const isSandbox = config.useSandbox !== false;
    
    // Set up configuration
    this.config = {
      ...config,
      // Default to sandbox if not specified
      useSandbox: isSandbox,
      // Set default timeout if not provided
      timeout: config.timeout || 30000,
      // Set base URLs based on environment
      baseUrl: isSandbox 
        ? (config.sandboxBaseUrl || 'https://abhasbx.abdm.gov.in')
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
    
    // Initialize or reuse the singleton Axios instance
    if (!HttpClient.instance) {
      // Initialize the Axios client with the base URL and SSL settings
      const httpsAgent = new (require('https').Agent)({ 
        rejectUnauthorized: false, // Only for sandbox, should be true in production
        keepAlive: true,
        timeout: this.config.timeout,
      });

      HttpClient.instance = axios.create({
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
    }
    
    this.client = HttpClient.instance;
    
    // Set up interceptors
    this._setupRequestInterceptors();
    this._setupResponseInterceptors();
    
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

    // Add request interceptor for authentication and logging
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const internalConfig = config as CustomAxiosRequestConfig;
        const requestId = generateRequestId();
        const timestamp = getCurrentTimestamp();
        internalConfig['requestId'] = requestId;
        internalConfig['timestamp'] = timestamp;

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

        // Get new token if needed
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
        const currentDate = new Date();
        const formattedTimestamp = currentDate.toISOString();
        
        Object.assign(internalConfig.headers, {
          'X-CM-ID': this.config['xcmId'] || 'sbx',
          'REQUEST-ID': requestId,
          'TIMESTAMP': formattedTimestamp,
          'Date': currentDate.toUTCString()
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
        const requestId = generateRequestId();
        const timestamp = getCurrentTimestamp();
        const internalConfig = config as CustomAxiosRequestConfig;
        internalConfig['requestId'] = requestId;
        internalConfig['timestamp'] = timestamp;

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
    const requestId = generateRequestId();
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
        
        // Use the correct sessions endpoint based on environment
        const sessionsPath = this.config.useSandbox ? '/v0.5/sessions' : '/v3/sessions';
        const authUrl = this.buildUrl(sessionsPath, 'auth');
          
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
   * Fetches the public key from the ABDM server and sets it internally
   * Always fetches fresh from the API, never from config or env
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
        // Handle production environment using the internal request method
        const response = await this.request<{ key?: string; publicKey?: string; public_key?: string }>({
          url: endpoint,
          method: 'GET'
        }, 'auth');
        
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
      // Do NOT add PEM headers/footers, always keep as base64 string
      this._publicKey = publicKey;
      return { key: publicKey };
    }
    return null;
  }

  /**
   * HTTP GET request
   * @param url The URL to send the GET request to
   * @param config Optional request configuration
   * @param serviceType The type of service to determine which base URL to use
   * @returns A promise that resolves to the API response
   */
  public async get<T = any>(
    url: string,
    config: Omit<RequestOptions, 'method' | 'url'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url }, serviceType);
  }

  /**
   * HTTP POST request
   * @param url The URL to send the POST request to
   * @param data The data to send in the request body
   * @param config Optional request configuration
   * @param serviceType The type of service to determine which base URL to use
   * @returns A promise that resolves to the API response
   */
  public async post<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestOptions, 'method' | 'url' | 'data'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data }, serviceType);
  }

  /**
   * HTTP PUT request
   * @param url The URL to send the PUT request to
   * @param data The data to send in the request body
   * @param config Optional request configuration
   * @param serviceType The type of service to determine which base URL to use
   * @returns A promise that resolves to the API response
   */
  public async put<T = any>(
    url: string,
    data?: any,
    config: Omit<RequestOptions, 'method' | 'url' | 'data'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data }, serviceType);
  }

  /**
   * HTTP DELETE request
   * @param url The URL to send the DELETE request to
   * @param config Optional request configuration
   * @param serviceType The type of service to determine which base URL to use
   * @returns A promise that resolves to the API response
   */
  public async delete<T = any>(
    url: string,
    config: Omit<RequestOptions, 'method' | 'url'> = {},
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url }, serviceType);
  }

  /**
   * The main request method that handles all HTTP requests
   * @param config The request configuration
   * @param serviceType The type of service to determine which base URL to use
   * @returns A promise that resolves to the API response
   */
  private async request<T = any>(
    config: RequestOptions,
    serviceType: 'auth' | 'gateway' | 'default' = 'default'
  ): Promise<ExtendedAPIResponse<T>> {
    // Generate request metadata
    const requestId = generateRequestId();
    const startTime = getCurrentTimestampMs();
    // Timestamp is used in the response
    const timestamp = getCurrentTimestamp();
    
    try {
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
    
      // Prepare request config with common headers
      const requestConfig: RequestOptions = {
        ...config,
        url: requestUrl,
        headers: {
          ...config.headers,
          'REQUEST-ID': requestId,
          'TIMESTAMP': timestamp,
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
        
        const duration = getCurrentTimestampMs() - startTime;
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
    } catch (error) {
      logger.error(`[${requestId}] Unexpected error in request:`, error);
      return {
        status: 'ERROR',
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        }
      } as ExtendedAPIResponse<T>;
    }
  }

  /**
   * Encrypts data using the ABDM public key fetched from the API.
   * @param data The string data to encrypt.
   * @returns The Base64-encoded encrypted string.
   * @throws {Error} If encryption fails or public key is not available
   */
  public async encrypt(data: string): Promise<string> {
    try {
      // Always fetch the public key fresh from the API before encryption
      const publicKeyResponse = await this.getPublicKey();
      if (!publicKeyResponse) {
        throw new Error('Failed to obtain public key for encryption');
      }
      const publicKey = publicKeyResponse.key;
      
      // Determine if the key is already in PEM format or needs conversion
      let pemKey: string;
      if (publicKey.includes('-----BEGIN PUBLIC KEY-----')) {
        // Key is already in PEM format
        pemKey = publicKey;
      } else {
        // Key is in base64 format, convert to PEM
        pemKey = base64ToPem(publicKey);
      }
      
      let keyObject;
      try {
        keyObject = crypto.createPublicKey(pemKey);
      } catch (err) {
        console.error('[ENCRYPTION ERROR] Failed to create public key object:', err instanceof Error ? err.message : err);
        console.error('[ENCRYPTION ERROR] Public key format check:', publicKey.includes('-----BEGIN PUBLIC KEY-----') ? 'PEM' : 'Base64');
        console.error('[ENCRYPTION ERROR] Public key (first 100 chars):', publicKey.slice(0, 100) + '...');
        throw new Error('Failed to create public key object: ' + (err instanceof Error ? err.message : err));
      }
      const buffer = Buffer.from(data, 'utf8');
      let encrypted: Buffer;
      try {
        encrypted = crypto.publicEncrypt(
          {
            key: keyObject,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha1', // Use SHA-1 as required by ABDM
          },
          buffer
        );
      } catch (err) {
        console.error('[ENCRYPTION ERROR] Failed to encrypt:', err instanceof Error ? err.message : err);
        console.error('[ENCRYPTION ERROR] Public key format check:', publicKey.includes('-----BEGIN PUBLIC KEY-----') ? 'PEM' : 'Base64');
        console.error('[ENCRYPTION ERROR] Public key (first 100 chars):', publicKey.slice(0, 100) + '...');
        throw new Error('Encryption failed: ' + (err instanceof Error ? err.message : err));
      }
      return encrypted.toString('base64');
    } catch (error: unknown) {
      if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Encryption failed:', error);
      }
      if (error instanceof Error) {
        throw new Error(`Encryption failed: ${error.message}`);
      }
      throw new Error('Encryption failed with unknown error');
    }
  }

  // HTTP methods are not used directly - all requests go through the request() method
}
