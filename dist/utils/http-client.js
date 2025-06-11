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
            baseURL: config.baseURL || 'https://dev.abdm.gov.in/gateway',
            useSandbox: config.useSandbox !== false, // Default to true
            timeout: config.timeout || 30000,
        };
        this.client = axios_1.default.create({
            baseURL: this.config.baseURL,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                ...(config.headers || {}),
            },
        });
        // Add request interceptor for authentication
        this.client.interceptors.request.use(async (config) => {
            const internalConfig = config;
            const authPathSegment = '/v0.5/sessions';
            // Skip auth for session creation requests
            if (internalConfig.url?.includes(authPathSegment)) {
                return config;
            }
            let currentToken = internalConfig.authToken || this._authToken;
            // Check if token is expired
            if (currentToken && this._tokenExpiry && new Date() >= this._tokenExpiry) {
                currentToken = null;
            }
            // Try to authenticate if no valid token
            if (!currentToken && this.config.clientId && this.config.clientSecret) {
                try {
                    await this.authenticate();
                    currentToken = this._authToken;
                }
                catch (error) {
                    logger_1.logger.error('Failed to re-authenticate during request:', error);
                    // Continue without token, will fail with 401
                }
            }
            // Add Authorization header if we have a token
            if (currentToken) {
                internalConfig.headers.Authorization = `Bearer ${currentToken}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }
    /**
     * Authenticates with ABDM and stores the access token and its expiry.
     */
    async authenticate() {
        if (!this.config.clientId || !this.config.clientSecret) {
            throw new Error('Client ID and Client Secret are required for authentication.');
        }
        try {
            const authUrl = `${this.config.baseURL || ''}/v0.5/sessions`;
            const authString = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
            const response = await axios_1.default.post(authUrl, { grantType: 'client_credentials' }, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${authString}`,
                    'X-CM-ID': this.config.xcmId || 'sbx',
                },
            });
            const { accessToken, expiresIn } = response.data;
            if (!accessToken) {
                throw new Error('No access token received in response');
            }
            this._authToken = accessToken;
            this._tokenExpiry = new Date(Date.now() + (expiresIn - 300) * 1000);
        }
        catch (error) {
            let errorMessage;
            if (axios_1.default.isAxiosError(error)) {
                errorMessage = error.response?.data?.error?.message || error.message || 'Unknown authentication error';
            }
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            else {
                errorMessage = 'An unexpected error occurred during authentication.';
            }
            logger_1.logger.error('ABDM Authentication Error:', error);
            throw new Error(`Authentication failed: ${errorMessage}`);
        }
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
        try {
            const response = await this.client.request({
                ...config,
                headers: {
                    ...config.headers,
                    'X-Request-ID': (0, uuid_1.v4)(),
                    'X-Timestamp': new Date().toISOString(),
                },
            });
            return response.data;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                throw this.normalizeError(error);
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