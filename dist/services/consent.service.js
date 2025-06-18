"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentService = void 0;
// Logger implementation - using console directly
/**
 * Service for handling consent and health information operations
 */
class ConsentService {
    /**
     * Create a new instance of ConsentService
     * @param http - An instance of HttpClient for making API requests
     */
    constructor(http) {
        this.basePath = '/v3';
        this.hiuBasePath = '/v3/consent-requests';
        this.healthInfoBasePath = '/v3/health-information';
        this.http = http;
    }
    // ======================
    // Consent Methods
    // ======================
    /**
     * Request consent from a user
     * @param consentRequest - Consent request details
     * @param authToken - Authentication token
     * @returns Promise with request ID
     */
    async requestConsent(consentRequest, authToken) {
        const response = await this.http.post(this.hiuBasePath, consentRequest, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to request consent');
        }
        return response.data;
    }
    /**
     * Get consent request status
     * @param consentRequestId - Consent request ID
     * @param authToken - Authentication token
     * @returns Promise with consent status
     */
    async getConsentStatus(consentRequestId, authToken) {
        const response = await this.http.get(`${this.hiuBasePath}/${consentRequestId}/status`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to get consent status');
        }
        return response.data;
    }
    // ======================
    // Health Information Methods
    // ======================
    /**
     * Request health information
     * @param request - Health information request details
     * @param authToken - Authentication token
     * @returns Promise with request ID
     */
    async requestHealthInformation(request, authToken) {
        const response = await this.http.post(this.healthInfoBasePath, request, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to request health information');
        }
        return response.data;
    }
    /**
     * Get health information
     * @param requestId - Health information request ID
     * @param authToken - Authentication token
     * @returns Promise with health information
     */
    async getHealthInformation(requestId, authToken) {
        const response = await this.http.get(`${this.healthInfoBasePath}/${requestId}`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to get health information');
        }
        return response.data;
    }
    // ======================
    // Bridge Service Methods
    // ======================
    /**
     * Register a bridge service
     * @param request - Bridge service registration request
     * @param authToken - Authentication token
     * @returns Promise with registration response
     */
    async registerBridgeService(request, authToken) {
        const response = await this.http.post(`${this.basePath}/bridges`, request, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to register bridge service');
        }
        return response.data;
    }
    /**
     * List all bridge services
     * @param authToken - Authentication token
     * @returns Promise with list of bridge services
     */
    async listBridgeServices(authToken) {
        const response = await this.http.get(`${this.basePath}/bridges`, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to list bridge services');
        }
        return response.data;
    }
}
exports.ConsentService = ConsentService;
exports.default = ConsentService;
//# sourceMappingURL=consent.service.js.map