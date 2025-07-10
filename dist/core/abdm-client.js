"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABDMClient = void 0;
const auth_service_1 = require("../services/auth.service");
const health_service_1 = require("../services/health.service");
const consent_service_1 = require("../services/consent.service");
const http_client_1 = require("../utils/http-client");
/**
 * Main client for interacting with the Ayushman Bharat Digital Mission (ABDM) APIs
 */
class ABDMClient {
    /**
     * Create a new ABDM client
     * @param config - Configuration for the ABDM client
     */
    /**
     * Create a new ABDM client
     * @param config - Configuration for the ABDM client
     * @example
     * // Basic usage with required config
     * const client = new ABDMClient({
     *   clientId: 'your-client-id',
     *   clientSecret: 'your-client-secret',
     *   baseUrl: 'https://dev.abdm.gov.in/gateway', // optional
     *   authBaseUrl: 'https://dev.abdm.gov.in/gateway', // optional
     *   useSandbox: true, // optional, defaults to true
     * });
     */
    constructor(config) {
        if (!config.clientId || !config.clientSecret) {
            throw new Error('clientId and clientSecret are required in the config object.');
        }
        // Set default values if not provided
        const effectiveConfig = {
            useSandbox: true,
            ...config,
        };
        // Set the baseURL based on the environment if not provided
        if (!effectiveConfig.baseUrl) {
            effectiveConfig.baseUrl = effectiveConfig.useSandbox
                ? 'https://abhasbx.abdm.gov.in' // Sandbox environment
                : 'https://abdm.gov.in'; // Production environment
        }
        // Set authBaseURL to baseURL if not provided
        if (!effectiveConfig.authBaseUrl) {
            effectiveConfig.authBaseUrl = effectiveConfig.baseUrl;
        }
        // Initialize HTTP client with configuration
        this.http = new http_client_1.HttpClient({
            clientId: effectiveConfig.clientId,
            clientSecret: effectiveConfig.clientSecret,
            baseUrl: effectiveConfig.baseUrl,
            authBaseUrl: effectiveConfig.authBaseUrl,
            useSandbox: effectiveConfig.useSandbox,
        });
        // Initialize services
        this.auth = new auth_service_1.AuthService(this.http);
        this.health = new health_service_1.HealthService(this.http);
        this.consent = new consent_service_1.ConsentService(this.http);
    }
    /**
     * Set a new authentication token
     * @param token - The authentication token
     * @param expiresIn - Optional time in seconds until the token expires (default: 1 hour)
     */
    setAuthToken(token, expiresIn = 3600) {
        if (!this.http) {
            throw new Error('HTTP client not initialized');
        }
        // Set the token using the public setter
        this.http.authToken = token;
        // Calculate expiry time (5 minutes before actual expiry to be safe)
        const expiryTime = Date.now() + (expiresIn - 300) * 1000;
        const expiryDate = new Date(expiryTime);
        // Set the expiry in the http client using the public setter
        this.http.tokenExpiry = expiryDate;
    }
    /**
     * Clear the current authentication token
     */
    clearAuthToken() {
        if (this.http) {
            this.http.authToken = null;
            this.http.tokenExpiry = null;
        }
    }
    /**
     * Get the current authentication token
     * @returns The current authentication token or null if not authenticated
     */
    getAuthToken() {
        return this.http.authToken;
    }
    /**
     * Check if the current token is valid
     * @returns True if the token is valid, false otherwise
     */
    isTokenValid() {
        if (!this.http) {
            return false;
        }
        // Use the public getter methods
        const authToken = this.http.authToken;
        const tokenExpiry = this.http.tokenExpiry;
        // If we don't have a token or expiry, it's not valid
        if (!authToken || !tokenExpiry) {
            return false;
        }
        // Check if the token is expired
        // tokenExpiry is already a Date object, so we can compare directly
        const now = new Date();
        // Only log token refresh in non-test environments
        if (process.env['NODE_ENV'] === 'test') {
            // eslint-disable-next-line no-console
            process.stdout.write(`[isTokenValid] now: ${now.getTime()}, tokenExpiry: ${tokenExpiry?.getTime()}\n`);
        }
        return now < tokenExpiry;
    }
    /**
     * Authenticate with ABDM and get an access token
     * @returns A promise that resolves when authentication is complete
     */
    async authenticate() {
        await this.http.authenticate();
    }
    /**
     * Generates an OTP for Aadhaar-based authentication
     * @param request The request containing Aadhaar number and other details
     * @returns A promise that resolves to the OTP response
     * @throws {Error} If the request fails or the environment is not supported
     */
    async generateAadhaarOTP(request) {
        try {
            // Log the attempt to generate Aadhaar OTP (without logging sensitive data)
            console.debug('Generating Aadhaar OTP...');
            // Delegate to the auth service implementation
            const response = await this.auth.generateAadhaarOTP(request);
            // Log success (without sensitive data)
            console.debug('Successfully generated Aadhaar OTP');
            return response;
        }
        catch (error) {
            // Log the error with context
            console.error('Failed to generate Aadhaar OTP:', error);
            // Re-throw the error with consistent formatting
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to generate Aadhaar OTP due to an unknown error');
        }
    }
    async createAbhaIdByAadhaar(request) {
        return this.auth.createAbhaIdByAadhaar(request);
    }
    /**
     * Verifies an OTP for Aadhaar-based authentication
     * @param request The request containing transaction ID and OTP value
     * @returns A promise that resolves to the OTP verification response
     * @throws {Error} If the request fails or the environment is not supported
     */
    async verifyAadhaarOTP(request) {
        try {
            // Log the attempt to verify Aadhaar OTP (without logging sensitive data)
            console.debug('Verifying Aadhaar OTP...');
            // Delegate to the auth service implementation
            const response = await this.auth.verifyAadhaarOTP(request);
            // Log success (without sensitive data)
            console.debug('Successfully verified Aadhaar OTP');
            return response;
        }
        catch (error) {
            // Log the error with context
            console.error('Failed to verify Aadhaar OTP:', error);
            // Re-throw the error with consistent formatting
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Failed to verify Aadhaar OTP due to an unknown error');
        }
    }
    /**
     * Fetches the public key from the ABDM server
     * @returns A promise that resolves to the public key response
     */
    async getPublicKey() {
        try {
            const response = await this.http.getPublicKey();
            if (!response) {
                return {
                    status: 'ERROR',
                    error: {
                        code: 'NO_RESPONSE',
                        message: 'No response from server when fetching public key'
                    }
                };
            }
            return {
                status: 'SUCCESS',
                data: response
            };
        }
        catch (error) {
            return {
                status: 'ERROR',
                error: {
                    code: 'PUBLIC_KEY_FETCH_ERROR',
                    message: error instanceof Error ? error.message : 'Failed to fetch public key',
                    details: error
                }
            };
        }
    }
    // Health Service Methods
    async addUpdateHealthFacilityServices(data) {
        return this.health.addUpdateHealthFacilityServices(data);
    }
    async getHealthFacility(facilityId) {
        return this.health.getHealthFacility(facilityId);
    }
    async listHealthFacilities() {
        return this.health.listHealthFacilities();
    }
    async updateHealthFacilityStatus(facilityId, active) {
        return this.health.updateHealthFacilityStatus(facilityId, active);
    }
    // Consent Service Methods
    async requestConsent(consentRequest, authToken) {
        return this.consent.requestConsent(consentRequest, authToken);
    }
    async getConsentStatus(consentRequestId, authToken) {
        return this.consent.getConsentStatus(consentRequestId, authToken);
    }
    async requestHealthInformation(request, authToken) {
        return this.consent.requestHealthInformation(request, authToken);
    }
    async getHealthInformation(requestId, authToken) {
        return this.consent.getHealthInformation(requestId, authToken);
    }
}
exports.ABDMClient = ABDMClient;
//# sourceMappingURL=abdm-client.js.map