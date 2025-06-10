/**
 * Common types used across the ABDM SDK
 */

export interface ABDMConfig {
  clientId?: string;
  clientSecret?: string;
  xcmId?: string;
  basePath?: string; // Main gateway URL, e.g., https://dev.abdm.gov.in/gateway
  baseUrl?: string; // Base URL for ABHA services, e.g., https://abhasbx.abdm.gov.in/abha
  useSandbox?: boolean; // If true, points to sandbox endpoints where applicable
  timeout?: number;
  debug?: boolean; // Enable debug logging
}

export interface APIErrorDetails {
  code: string;
  message: string;
  attr: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: APIErrorDetails[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  status: number;
  statusText: string;
  headers?: Record<string, unknown>;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
  authToken?: string;
}
