/**
 * Common types used across the ABDM SDK
 */
/**
 * Authentication configuration for ABDM API
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
    expiryInSeconds?: number;
}
/**
 * HTTP client configuration
 */
export interface HTTPClientConfig {
    /** Base URL for API requests */
    baseURL?: string;
    /** Base URL for authentication requests (defaults to baseURL if not provided) */
    authBaseURL?: string;
    /** Custom headers to include in requests */
    headers?: Record<string, string>;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Enable debug logging */
    debug?: boolean;
    /** Use sandbox environment (default: true) */
    useSandbox?: boolean;
}
/**
 * ABDM SDK configuration
 */
export interface ABDMConfig extends ABDMAuthConfig, HTTPClientConfig {
    /** API version to use */
    version?: string;
    /** Custom fetch implementation */
    fetchImplementation?: typeof fetch;
}
/**
 * Request options
 */
export interface RequestOptions {
    /** API version override */
    version?: string;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Custom headers */
    headers?: Record<string, string>;
    /** Query parameters */
    params?: Record<string, any>;
    /** Request ID for tracing */
    requestId?: string;
}
/**
 * Standard API response format
 */
export interface APIResponse<T = any> {
    /** Response data */
    data: T;
    /** Response status code */
    status: number;
    /** Response headers */
    headers: Record<string, string>;
    /** Request configuration */
    config: any;
    /** Request timestamp */
    timestamp: Date;
}
/**
 * Standard API error format
 */
export interface APIError extends Error {
    /** Error code */
    code: string | number;
    /** Error details */
    details?: any;
    /** HTTP status code */
    status?: number;
    /** Request configuration */
    config?: any;
    /** Response data */
    response?: {
        data: any;
        status: number;
        headers: Record<string, string>;
    };
}
/**
 * Error details from ABDM API
 */
export interface APIErrorDetails {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Error target (field name) */
    target?: string;
    /** Additional error details */
    details?: Record<string, any>;
}
//# sourceMappingURL=common.d.ts.map