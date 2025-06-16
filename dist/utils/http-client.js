"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const tslib_1 = require("tslib");
const crypto = tslib_1.__importStar(require("crypto"));
const axios_1 = tslib_1.__importDefault(require("axios"));
const uuid_1 = require("uuid");
const logger_1 = require("./logger");
class HttpClient {
    /**
     * Get the current authentication token
     */
    get authToken() {
        return this._authToken;
    }
    /**
     * Set the authentication token
     */
    set authToken(token) {
        this._authToken = token;
    }
    /**
     * Get the token expiry time
     */
    get tokenExpiry() {
        return this._tokenExpiry;
    }
    /**
     * Set the token expiry time
     */
    set tokenExpiry(expiry) {
        this._tokenExpiry = expiry;
    }
    /**
     * Get the current authentication token (legacy method)
     */
    getAuthToken() {
        return this.authToken;
    }
    /**
     * Set the authentication token (legacy method)
     */
    setAuthToken(token) {
        this.authToken = token;
    }
    /**
     * Get the public key
     */
    get publicKey() {
        return this._publicKey;
    }
    /**
     * Set the public key
     */
    set publicKey(publicKey) {
        this._publicKey = publicKey;
    }
    /**
     * Get the private key
     */
    get privateKey() {
        return this._privateKey;
    }
    /**
     * Set the private key
     */
    set privateKey(privateKey) {
        this._privateKey = privateKey;
    }
    /**
     * Get the key ID
     */
    get keyId() {
        return this._keyId;
    }
    /**
     * Set the key ID
     */
    set keyId(keyId) {
        this._keyId = keyId;
    }
    constructor(config) {
        this._authToken = null;
        this._tokenExpiry = null;
        this._publicKey = null;
        this._privateKey = null;
        this._keyId = null;
        this.config = {
            ...config,
            baseUrl: config.baseUrl || 'https://dev.abdm.gov.in/gateway',
            useSandbox: config.useSandbox !== false, // Default to true
            timeout: config.timeout || 30000,
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(config.headers || {}),
            },
        });
        // Add request interceptor for authentication and logging
        this.client.interceptors.request.use(async (config) => {
            const internalConfig = config;
            const requestId = Math.random().toString(36).substring(2, 8);
            internalConfig.requestId = requestId;
            internalConfig.timestamp = Date.now();
            // Log the request details
            logger_1.logger.debug(`[${requestId}] === REQUEST START ===`);
            logger_1.logger.debug(`[${requestId}] ${config.method?.toUpperCase()} ${config.url}`);
            logger_1.logger.debug(`[${requestId}] Headers:`, {
                ...config.headers,
                'Authorization': config.headers?.Authorization ? 'Bearer ***' : undefined,
            });
            if (config.data) {
                logger_1.logger.debug(`[${requestId}] Request Data:`, config.data);
            }
            // Skip auth for session creation requests
            if (internalConfig.url?.includes('/hiecm/gateway/v3/sessions')) {
                logger_1.logger.debug(`[${requestId}] Auth endpoint - skipping auth header`);
                return config;
            }
            let currentToken = internalConfig.authToken || this._authToken;
            // Check if token is expired
            if (currentToken && this._tokenExpiry) {
                if (new Date() >= this._tokenExpiry) {
                    logger_1.logger.debug(`[${requestId}] Token expired at ${this._tokenExpiry.toISOString()}`);
                    currentToken = null;
                }
                else {
                    logger_1.logger.debug(`[${requestId}] Using existing token (expires at ${this._tokenExpiry.toISOString()})`);
                }
            }
            // Try to authenticate if no valid token
            if (!currentToken && this.config.clientId && this.config.clientSecret) {
                logger_1.logger.debug(`[${requestId}] No valid token - attempting to authenticate...`);
                try {
                    await this.authenticate();
                    currentToken = this._authToken;
                    logger_1.logger.debug(`[${requestId}] Successfully authenticated`);
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    logger_1.logger.error(`[${requestId}] Failed to re-authenticate during request: ${errorMessage}`);
                    // Continue without token, will fail with 401
                }
            }
            else if (!currentToken) {
                logger_1.logger.debug(`[${requestId}] No credentials available for authentication`);
            }
            // Add Authorization header if we have a token
            if (currentToken) {
                internalConfig.headers.Authorization = `Bearer ${currentToken}`;
                logger_1.logger.debug(`[${requestId}] Added Authorization header`);
            }
            else {
                logger_1.logger.debug(`[${requestId}] No Authorization header added`);
            }
            return config;
        }, (error) => {
            const requestId = error.config?.requestId || 'unknown';
            logger_1.logger.error(`[${requestId}] Request interceptor error:`, error);
            return Promise.reject(error);
        });
        // Add response interceptor for logging
        this.client.interceptors.response.use((response) => {
            const requestId = response.config?.requestId || 'unknown';
            const duration = Date.now() - (response.config?.timestamp || 0);
            logger_1.logger.debug(`[${requestId}] === RESPONSE RECEIVED (${duration}ms) ===`);
            logger_1.logger.debug(`[${requestId}] Status: ${response.status} ${response.statusText}`);
            logger_1.logger.debug(`[${requestId}] Headers:`, response.headers);
            if (response.data) {
                logger_1.logger.debug(`[${requestId}] Response Data:`, response.data);
            }
            return response;
        }, (error) => {
            const requestId = error.config?.requestId || 'unknown';
            const duration = error.config ? (Date.now() - (error.config?.timestamp || 0)) : 0;
            logger_1.logger.error(`[${requestId}] === REQUEST FAILED (${duration}ms) ===`);
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                logger_1.logger.error(`[${requestId}] Error Status: ${error.response.status}`);
                logger_1.logger.error(`[${requestId}] Error Headers:`, error.response.headers);
                logger_1.logger.error(`[${requestId}] Error Data:`, error.response.data);
            }
            else if (error.request) {
                // The request was made but no response was received
                logger_1.logger.error(`[${requestId}] No response received:`, error.request);
            }
            else {
                // Something happened in setting up the request that triggered an Error
                logger_1.logger.error(`[${requestId}] Request setup error:`, error.message);
            }
            return Promise.reject(error);
        });
    }
    /**
     * Authenticates with ABDM and returns the access token.
     * @param retryCount Number of times to retry on 202 Accepted (default: 3)
     * @param retryDelay Delay between retries in milliseconds (default: 1000)
     */
    async authenticate(retryCount = 3, retryDelay = 1000) {
        const requestId = Math.random().toString(36).substring(2, 8);
        const startTime = Date.now();
        if (!this.config.clientId || !this.config.clientSecret) {
            const error = new Error('Client ID and Client Secret are required for authentication');
            logger_1.logger.error(`[${requestId}] Authentication error: ${error.message}`);
            throw error;
        }
        // Log the config being used for authentication
        logger_1.logger.debug(`[${requestId}] === AUTHENTICATION CONFIGURATION ===`);
        logger_1.logger.debug(`[${requestId}] Base URL: ${this.config.baseUrl}`);
        logger_1.logger.debug(`[${requestId}] Sandbox Mode: ${this.config.useSandbox}`);
        logger_1.logger.debug(`[${requestId}] Timeout: ${this.config.timeout || 30000}ms`);
        logger_1.logger.debug(`[${requestId}] Client ID: ${this.config.clientId ? '*** (set)' : 'undefined'}`);
        logger_1.logger.debug(`[${requestId}] Client Secret: ${this.config.clientSecret ? '*** (set)' : 'undefined'}`);
        logger_1.logger.debug(`[${requestId}] X-CM-ID: ${this.config.xcmId || 'sbx (default)'}`);
        // Use the v3 authentication endpoint for ABDM with the correct path
        // Remove the /gateway part from baseUrl and replace with /api
        const base = this.config.baseUrl.endsWith('/') ? this.config.baseUrl.slice(0, -1) : this.config.baseUrl;
        const baseUrlWithoutGateway = base.replace('/gateway', '');
        const authUrl = `${baseUrlWithoutGateway}/api/hiecm/gateway/v3/sessions`;
        logger_1.logger.debug(`[${requestId}] Authentication Endpoint: ${authUrl}`);
        // Prepare request data as JSON
        const requestData = {
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            grantType: 'client_credentials'
        };
        // Create a custom request config with proper typing
        const requestConfig = {
            url: authUrl,
            method: 'POST',
            data: requestData,
            headers: {
                'Content-Type': 'application/json',
                'REQUEST-ID': requestId,
                'TIMESTAMP': new Date().toISOString(),
                'X-CM-ID': this.config.xcmId || 'sbx',
                'Accept': 'application/json'
            },
            timeout: this.config.timeout || 30000,
            transitional: {
                silentJSONParsing: false,
                forcedJSONParsing: true,
                clarifyTimeoutError: true
            }
        };
        let attempts = 0;
        let lastError = null;
        let response = null;
        // Helper function to calculate delay with jitter
        const calculateDelay = (baseDelay, attempt) => {
            const backoff = baseDelay * Math.pow(2, attempt - 1);
            const jitter = Math.random() * 0.2 * backoff; // Add up to 20% jitter
            return Math.min(backoff + jitter, 30000); // Cap at 30 seconds
        };
        while (attempts < retryCount) {
            attempts++;
            const attemptStartTime = Date.now();
            try {
                logger_1.logger.debug(`[${requestId}] Authentication attempt ${attempts}/${retryCount}...`);
                // Make the authentication request with detailed logging
                logger_1.logger.debug(`[${requestId}] Sending authentication request to: ${authUrl}`);
                logger_1.logger.debug(`[${requestId}] Request headers:`, {
                    ...requestConfig.headers,
                    'X-CLIENT-ID': this.config.clientId ? '***' : '(not set)',
                    'X-TIMESTAMP': requestConfig.headers?.['TIMESTAMP']
                });
                try {
                    response = await this.client.request({
                        ...requestConfig,
                        responseType: 'text',
                        validateStatus: (status) => {
                            // Accept both success (2xx) and 202 (Accepted) status codes
                            const isValid = (status >= 200 && status < 300) || status === 202;
                            logger_1.logger.debug(`[${requestId}] Status validation for ${status}: ${isValid ? 'valid' : 'invalid'}`);
                            return isValid;
                        },
                        // Add timeout for this specific request
                        timeout: Math.min(this.config.timeout || 30000, 15000) // Cap at 15s for auth requests
                    });
                }
                catch (requestError) {
                    if (axios_1.default.isAxiosError(requestError)) {
                        // Handle network errors and timeouts specifically
                        if (requestError.code === 'ECONNABORTED') {
                            throw new Error(`Request timed out after ${requestError.config?.timeout}ms`);
                        }
                        if (requestError.code === 'ECONNREFUSED') {
                            throw new Error(`Connection refused to ${requestError.config?.url}`);
                        }
                    }
                    throw requestError; // Re-throw for the outer catch to handle
                }
                const endTime = Date.now();
                const duration = endTime - startTime;
                logger_1.logger.debug(`[${requestId}] Request completed in ${duration}ms`);
                logger_1.logger.debug(`[${requestId}] Status: ${response.status} ${response.statusText}`);
                logger_1.logger.debug(`[${requestId}] Headers:`, response.headers);
                // If we got a successful response with a token
                if (response.status >= 200 && response.status < 300) {
                    let responseData;
                    try {
                        // Try to parse the response data
                        const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
                        responseData = JSON.parse(responseText);
                        if (responseData.accessToken) {
                            // Store the token and expiry
                            this._authToken = responseData.accessToken;
                            this._tokenExpiry = new Date(Date.now() + ((responseData.expiresIn || 1199) * 1000));
                            logger_1.logger.debug(`[${requestId}] Authentication successful`);
                            logger_1.logger.debug(`[${requestId}] Token Type: ${responseData.tokenType}`);
                            logger_1.logger.debug(`[${requestId}] Expires In: ${responseData.expiresIn} seconds`);
                            logger_1.logger.debug(`[${requestId}] Token will expire at: ${this._tokenExpiry.toISOString()}`);
                            return responseData.accessToken;
                        }
                        throw new Error('No access token in response');
                    }
                    catch (parseError) {
                        const errorMsg = parseError instanceof Error
                            ? `Failed to parse authentication response: ${parseError.message}`
                            : 'Failed to parse authentication response: Unknown error';
                        throw new Error(errorMsg);
                    }
                }
                // Handle 202 Accepted with retry
                if (response.status === 202) {
                    const retryAfter = response.headers['retry-after']
                        ? Math.max(1000, parseInt(response.headers['retry-after'], 10) * 1000) // Ensure minimum 1s
                        : calculateDelay(retryDelay, attempts);
                    const attemptDuration = Date.now() - attemptStartTime;
                    logger_1.logger.warn(`[${requestId}] Request accepted but not completed (202). Attempt ${attempts}/${retryCount} failed in ${attemptDuration}ms`);
                    // Log response headers for debugging
                    logger_1.logger.debug(`[${requestId}] Response headers:`, response.headers);
                    // Only retry if we have attempts left
                    if (attempts < retryCount) {
                        logger_1.logger.info(`[${requestId}] Retrying in ${Math.round(retryAfter / 1000)}s...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                        continue;
                    }
                    else {
                        throw new Error('Maximum retry attempts reached for 202 Accepted response');
                    }
                }
                // If we get here, we have an unexpected status code
                throw new Error(`Authentication failed with status ${response.status}: ${response.statusText}`);
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Log detailed error information
                if (axios_1.default.isAxiosError(error) && error.response) {
                    const errResponse = error.response;
                    // Log detailed error information
                    const errorDetails = {
                        status: errResponse.status,
                        statusText: errResponse.statusText,
                        url: errResponse.config?.url,
                        method: errResponse.config?.method?.toUpperCase(),
                        headers: {
                            ...errResponse.config?.headers,
                            'X-CLIENT-ID': '***',
                            'X-CLIENT-SECRET': '***',
                            'Authorization': '***'
                        }
                    };
                    logger_1.logger.error(`[${requestId}] Authentication error (${attempts}/${retryCount}): ${errResponse.status} ${errResponse.statusText}`, errorDetails);
                    // Try to extract and log error details from response
                    if (errResponse.data) {
                        try {
                            const errorData = typeof errResponse.data === 'string'
                                ? JSON.parse(errResponse.data)
                                : errResponse.data;
                            // Log error details in a more structured way
                            const errorInfo = {
                                error: errorData.error || 'Unknown error',
                                message: errorData.message || 'No error message provided',
                                code: errorData.code || 'no_error_code',
                                details: errorData.details || []
                            };
                            logger_1.logger.error(`[${requestId}] Error details:`, errorInfo);
                            // If we have a 400/401 error with specific message, provide more context
                            if ((errResponse.status === 400 || errResponse.status === 401) && errorData.message) {
                                logger_1.logger.error(`[${requestId}] Authentication failed: ${errorData.message}`);
                                if (errorData.message.includes('invalid_client')) {
                                    logger_1.logger.error(`[${requestId}] Please verify your client_id and client_secret are correct`);
                                }
                            }
                        }
                        catch (e) {
                            // If we can't parse the error, log the raw response
                            const responsePreview = String(errResponse.data).substring(0, 500);
                            logger_1.logger.error(`[${requestId}] Raw error response (${responsePreview.length} chars):`, responsePreview);
                            // If the response is HTML, it might be a proxy or gateway error page
                            if (responsePreview.trim().toLowerCase().startsWith('<!doctype html>') ||
                                responsePreview.trim().toLowerCase().startsWith('<html>')) {
                                logger_1.logger.error(`[${requestId}] Received HTML response - this might indicate a proxy or gateway issue`);
                            }
                        }
                    }
                    // If we get a 401, there's no point in retrying with the same credentials
                    if (errResponse.status === 401) {
                        logger_1.logger.error(`[${requestId}] Invalid credentials. Stopping retries.`);
                        break;
                    }
                    // For rate limiting, use the Retry-After header if available
                    if (errResponse.status === 429) {
                        const retryAfter = errResponse.headers['retry-after']
                            ? parseInt(errResponse.headers['retry-after'], 10) * 1000
                            : retryDelay * Math.pow(2, attempts);
                        if (attempts < retryCount) {
                            logger_1.logger.warn(`[${requestId}] Rate limited. Waiting ${retryAfter}ms before retry (${attempts + 1}/${retryCount})...`);
                            await new Promise(resolve => setTimeout(resolve, retryAfter));
                            continue;
                        }
                    }
                }
                else {
                    logger_1.logger.error(`[${requestId}] Request error (${attempts}/${retryCount}):`, error);
                }
                // If we've exhausted all retries, break the loop
                if (attempts >= retryCount) {
                    break;
                }
                // Exponential backoff for retries
                const delay = retryDelay * Math.pow(2, attempts - 1);
                logger_1.logger.debug(`[${requestId}] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        // If we get here, all retries have failed
        const errorMessage = lastError
            ? `Authentication failed after ${retryCount} attempts: ${lastError.message}`
            : `Authentication failed after ${retryCount} attempts`;
        logger_1.logger.error(`[${requestId}] ${errorMessage}`);
        throw new Error(errorMessage);
    }
    /**
     * Encrypts data using the ABDM public key.
     * @param data The string data to encrypt.
     * @returns The Base64-encoded encrypted string.
     */
    encrypt(data) {
        if (!this._publicKey) {
            throw new Error('Public key is not set. Cannot encrypt data.');
        }
        try {
            const buffer = Buffer.from(data, 'utf8');
            const encrypted = crypto.publicEncrypt({
                key: this._publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256',
            }, buffer);
            return encrypted.toString('base64');
        }
        catch (error) {
            logger_1.logger.error('Encryption failed:', error);
            if (error instanceof Error) {
                throw new Error(`Encryption failed: ${error.message}`);
            }
            throw new Error('An unknown error occurred during encryption.');
        }
    }
    /**
     * The core request method for all HTTP calls.
     * @param config The Axios request config.
     * @returns A standardized APIResponse object.
     */
    async request(config) {
        const requestId = Math.random().toString(36).substring(2, 8);
        const startTime = Date.now();
        // Log the request details
        logger_1.logger.debug(`[${requestId}] === STARTING REQUEST ===`);
        logger_1.logger.debug(`[${requestId}] ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
        logger_1.logger.debug(`[${requestId}] Headers:`, {
            ...config.headers,
            Authorization: config.headers?.Authorization ? 'Bearer ***' : undefined,
        });
        if (config.data) {
            logger_1.logger.debug(`[${requestId}] Request Data:`, config.data);
        }
        try {
            const response = await this.client.request({
                ...config,
                headers: {
                    ...config.headers,
                    'X-Request-ID': (0, uuid_1.v4)(),
                    'X-Timestamp': new Date().toISOString(),
                },
            });
            const duration = Date.now() - startTime;
            logger_1.logger.debug(`[${requestId}] === REQUEST COMPLETED (${duration}ms) ===`);
            logger_1.logger.debug(`[${requestId}] Status: ${response.status} ${response.statusText}`);
            if (response.data) {
                logger_1.logger.debug(`[${requestId}] Response Data:`, response.data);
            }
            return response.data;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const axiosError = error;
            logger_1.logger.error(`[${requestId}] === REQUEST FAILED (${duration}ms) ===`);
            if (axiosError.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                logger_1.logger.error(`[${requestId}] Error Status: ${axiosError.response.status}`);
                logger_1.logger.error(`[${requestId}] Error Headers:`, axiosError.response.headers);
                logger_1.logger.error(`[${requestId}] Error Data:`, axiosError.response.data);
            }
            else if (axiosError.request) {
                // The request was made but no response was received
                logger_1.logger.error(`[${requestId}] No response received:`, axiosError.request);
            }
            else {
                // Something happened in setting up the request that triggered an Error
                logger_1.logger.error(`[${requestId}] Request setup error:`, axiosError.message);
            }
            if (axios_1.default.isAxiosError(axiosError)) {
                throw this.normalizeError(axiosError);
            }
            throw error;
        }
    }
    /**
     * Normalize error response from Axios.
     * @param error The Axios error.
     * @returns A standardized error object.
     */
    normalizeError(error) {
        const response = error.response?.data;
        const errorData = response?.error || response || {};
        const errorMessage = errorData.message || errorData.error?.message || error.message;
        const errorCode = errorData.code || errorData.error?.code || 'UNKNOWN_ERROR';
        const normalizedError = new Error(`[${errorCode}] ${errorMessage}`);
        normalizedError.code = errorCode;
        normalizedError.details = errorData.details || errorData.error?.details;
        if (error.response?.status) {
            normalizedError.status = error.response.status;
        }
        return normalizedError;
    }
    // --- HTTP Method Helpers ---
    async get(url, config) {
        return this.request({ ...config, method: 'GET', url });
    }
    async post(url, data, config) {
        return this.request({ ...config, method: 'POST', url, data });
    }
    async put(url, data, config) {
        return this.request({ ...config, method: 'PUT', url, data });
    }
    async delete(url, config) {
        return this.request({ ...config, method: 'DELETE', url });
    }
    async patch(url, data, config) {
        return this.request({ ...config, method: 'PATCH', url, data });
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=http-client.js.map