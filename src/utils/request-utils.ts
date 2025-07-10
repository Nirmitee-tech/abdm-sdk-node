import { randomUUID } from 'crypto';

/**
 * Generates a random request ID
 * @param length Length of the request ID (default: 8)
 * @returns A random string to be used as request ID
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Gets the current timestamp in ISO format
 * @returns Current timestamp string in ISO format
 */
export function getCurrentTimestamp(): string {
  const now = new Date();
  // Format: YYYY-MM-DDTHH:mm:ssZ (no milliseconds, UTC)
  const ts = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  // Log the generated timestamp for debugging
  if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Generated TIMESTAMP:', ts, '| System UTC:', now.toUTCString());
  }
  return ts;
}

/**
 * Gets the current timestamp in milliseconds since epoch
 * @returns Current timestamp in milliseconds
 */
export function getCurrentTimestampMs(): number {
  return Date.now();
}

/**
 * Common request metadata used across API calls
 */
export interface RequestMetadata {
  requestId: string;
  timestamp: string;
  timestampMs: number;
}

/**
 * Generates common request metadata
 * @returns An object containing request metadata
 */
export function generateRequestMetadata(): RequestMetadata {
  return {
    requestId: generateRequestId(),
    timestamp: getCurrentTimestamp(),
    timestampMs: getCurrentTimestampMs(),
  };
}

/**
 * Common headers to be included in all requests
 * @param metadata Request metadata
 * @param additionalHeaders Any additional headers to include
 * @returns An object containing common headers
 */
export function getCommonHeaders(
  metadata: RequestMetadata,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  return {
    'REQUEST-ID': metadata.requestId,
    'TIMESTAMP': metadata.timestamp,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...additionalHeaders,
  };
}
