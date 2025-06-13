/**
 * Common types used across ABDM SDK
 */

export interface APIResponse<T = any> {
  status: 'SUCCESS' | 'ERROR';
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  refreshToken: string;
  tokenType: string;
}

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
}

export interface ABDMConfig {
  baseUrl: string;
  authBaseURL?: string;
  clientId: string;
  clientSecret: string;
  timeout?: number;
  headers?: Record<string, string>;
  useSandbox?: boolean;
}
