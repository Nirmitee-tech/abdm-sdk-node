/**
 * Generates a random request ID
 * @param length Length of the request ID (default: 8)
 * @returns A random string to be used as request ID
 */
export function generateRequestId(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Gets the current timestamp in ISO format
 * @returns Current timestamp string in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
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
    'X-Request-ID': metadata.requestId,
    'X-Timestamp': metadata.timestamp,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...additionalHeaders,
  };
}
