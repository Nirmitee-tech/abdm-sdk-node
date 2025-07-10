"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequestId = generateRequestId;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.getCurrentTimestampMs = getCurrentTimestampMs;
exports.generateRequestMetadata = generateRequestMetadata;
exports.getCommonHeaders = getCommonHeaders;
const crypto_1 = require("crypto");
/**
 * Generates a random request ID
 * @param length Length of the request ID (default: 8)
 * @returns A random string to be used as request ID
 */
function generateRequestId() {
    return (0, crypto_1.randomUUID)();
}
/**
 * Gets the current timestamp in ISO format
 * @returns Current timestamp string in ISO format
 */
function getCurrentTimestamp() {
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
        'REQUEST-ID': metadata.requestId,
        'TIMESTAMP': metadata.timestamp,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...additionalHeaders,
    };
}
//# sourceMappingURL=request-utils.js.map