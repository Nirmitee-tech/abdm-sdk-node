/**
 * Common types used across the ABDM SDK
 */

export interface ABDMConfig {
  clientId?: string;
  clientSecret?: string;
  xcmId?: string;
  basePath?: string; // Main gateway URL, e.g., https://dev.abdm.gov.in/gateway
  useSandbox?: boolean; // If true, points to sandbox endpoints where applicable
  timeout?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | {
    code?: string | number;
    message: string;
    details?: Record<string, unknown>;
  };
  status?: number;
  statusCode: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
  authToken?: string;
}

export interface ABDMError {
  code?: string | number;
  message: string;
  details?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export interface ABDMErrorResponse {
  error: ABDMError;
  // Depending on API, there might be other top-level fields like requestId, timestamp, etc.
}
