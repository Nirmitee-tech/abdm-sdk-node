"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequestId = generateRequestId;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.getCurrentTimestampMs = getCurrentTimestampMs;
exports.generateRequestMetadata = generateRequestMetadata;
exports.getCommonHeaders = getCommonHeaders;
/**
 * Generates a random request ID
 * @param length Length of the request ID (default: 8)
 * @returns A random string to be used as request ID
 */
function generateRequestId(length = 8) {
    return Math.random().toString(36).substring(2, 2 + length);
}
/**
 * Gets the current timestamp in ISO format
 * @returns Current timestamp string in ISO format
 */
function getCurrentTimestamp() {
    return new Date().toISOString();
}
/**
 * Gets the current timestamp in milliseconds since epoch
 * @returns Current timestamp in milliseconds
 */
function getCurrentTimestampMs() {
    return Date.now();
}
/**
 * Generates common request metadata
 * @returns An object containing request metadata
 */
function generateRequestMetadata() {
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
function getCommonHeaders(metadata, additionalHeaders = {}) {
    return {
        'X-Request-ID': metadata.requestId,
        'X-Timestamp': metadata.timestamp,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...additionalHeaders,
    };
}
//# sourceMappingURL=request-utils.js.map