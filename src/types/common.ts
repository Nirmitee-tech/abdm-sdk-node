/**
 * Common types used across ABDM SDK
 */

/**
 * Base API response type
 */
export interface APIResponse<T = any> {
  /** Response status */
  status: 'SUCCESS' | 'ERROR';
  
  /** Response data */
  data?: T;
  
  /** Error details if status is ERROR */
  error?: {
    /** Error code */
    code: string | number;
    /** Error message */
    message: string;
    /** Additional error details */
    details?: any;
  };
}

/**
 * Authentication session response
 */
export interface SessionResponse {
  /** Access token */
  accessToken: string;
  /** Time in seconds until the access token expires */
  expiresIn: number;
  /** Time in seconds until the refresh token expires */
  refreshExpiresIn: number;
  /** Refresh token */
  refreshToken: string;
  /** Token type (usually 'bearer') */
  tokenType: string;
  /** Scopes granted to the access token */
  scope?: string;
}

/**
 * Authentication configuration
 */
export interface ABDMAuthConfig {
  /** Client ID provided by ABDM */
  clientId: string;
  /** Client secret provided by ABDM */
  clientSecret: string;
  /** Authentication token (if already obtained) */
  authToken?: string;
  /** Private key for JWT signing (if using JWT auth) */
  privateKey?: string;
  /** Key ID (if using JWT auth) */
  keyId?: string;
  /** Public key for verification (if needed) */
  publicKey?: string;
  /** Token expiry time in seconds (default: 1 hour) */
  tokenExpiry?: number;
  /** Authentication URL (optional, defaults to standard ABDM auth URL) */
  authUrl?: string;
  /** Token URL (optional, defaults to standard ABDM token URL) */
  tokenUrl?: string;
  /** Scopes to request (space-separated) */
  scope?: string;
}

/**
 * Environment-specific URLs for ABDM services
 */
export interface ABDMEnvironmentURLs {
  /** Base URL for API requests */
  baseUrl: string;
  /** Base URL for authentication requests */
  authBaseUrl: string;
  /** Base URL for gateway requests */
  gatewayBaseUrl: string;
  /** URL for public key endpoint */
  publicKeyUrl: string;
  /** URL for OTP generation */
  otpUrl: string;
}

/**
 * ABDM SDK configuration
 */
export interface ABDMConfig extends ABDMAuthConfig, Partial<ABDMEnvironmentURLs> {
  /** Whether to use sandbox environment (default: false) */
  useSandbox?: boolean;
  
  /** Environment-specific URLs */
  urls?: {
    sandbox?: Partial<ABDMEnvironmentURLs>;
    production?: Partial<ABDMEnvironmentURLs>;
  };
  
  /** @deprecated Use urls.sandbox instead */
  sandbox?: Partial<ABDMEnvironmentURLs>;
  
  /** @deprecated Use urls.production instead */
  production?: Partial<ABDMEnvironmentURLs>;
  
  /** Sandbox-specific base URL (overrides urls.sandbox.baseUrl) */
  sandboxBaseUrl?: string;
  
  /** Sandbox-specific auth base URL (overrides urls.sandbox.authBaseUrl) */
  sandboxAuthBaseUrl?: string;
  
  /** Sandbox-specific gateway URL (overrides urls.sandbox.gatewayBaseUrl) */
  sandboxGatewayUrl?: string;
  
  /** X-CM-ID header value */
  xcmId?: string;
  
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  
  /** Additional headers to include in all requests */
  headers?: Record<string, string>;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Retry configuration */
  retry?: {
    /** Maximum number of retries (default: 3) */
    maxRetries?: number;
    /** Initial delay between retries in ms (default: 1000) */
    initialDelay?: number;
    /** Maximum delay between retries in ms (default: 10000) */
    maxDelay?: number;
    /** Function to determine if a request should be retried */
    retryIf?: (error: any) => boolean;
  };
  
  /** @deprecated Use retry.maxRetries instead */
  maxRetries?: number;
  
  /** @deprecated Use retry.initialDelay instead */
  initialDelay?: number;
  
  /** @deprecated Use retry.maxDelay instead */
  maxDelay?: number;
  
  /** @deprecated Use retry.retryIf instead */
  retryIf?: (error: any) => boolean;
  
  // For backward compatibility
  authBaseUrl?: string;
  gatewayBaseUrl?: string;
  baseUrl?: string;
}
