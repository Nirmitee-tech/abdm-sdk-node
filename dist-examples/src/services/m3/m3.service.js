"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M3Service = void 0;
/**
 * Service class for ABDM Milestone 3 APIs
 * Handles HIU (Health Information User) operations and bridge service management
 */
class M3Service {
    /**
     * Create a new instance of M3Service
     * @param http - An instance of HttpClient for making API requests
     */
    constructor(http) {
        this.basePath = '/v3';
        this.hiuBasePath = '/v3/consent-requests';
        this.healthInfoBasePath = '/v3/health-information';
        this.http = http;
    }
    // ======================
    // Session Management
    // ======================
    /**
     * Create a new session
     * @param clientId - Client ID
     * @param clientSecret - Client secret
     * @returns Promise with session details
     * @deprecated Sessions are now managed automatically by the HttpClient
     */
    async createSession(_clientId, _clientSecret) {
        // In v3, authentication is handled by the HttpClient using client credentials
        const authToken = this.http.getAuthToken();
        if (!authToken) {
            throw new Error('Authentication token not available. Please authenticate first.');
        }
        return {
            accessToken: authToken,
            tokenType: 'bearer',
            expiresIn: 300 // Default expiration time in seconds
        };
    }
    // ======================
    // Bridge Service Management
    // ======================
    /**
     * Update bridge URL
     * @param bridgeId - Bridge ID
     * @param url - New bridge URL
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    async updateBridgeUrl(bridgeId, url, authToken) {
        const response = await this.http.patch(`${this.basePath}/bridges/${bridgeId}`, { url }, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to update bridge URL');
        }
        return response.data;
    }
    /**
     * Register a new bridge service (HIP/HIU)
     * @param service - Service details
     * @param authToken - Authentication token
     * @returns Promise with registered service details
     */
    async registerBridgeService(service, authToken) {
        const response = await this.http.post(`${this.basePath}/services`, service, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to register bridge service');
        }
        return response.data;
    }
    /**
     * Find bridge service by service ID
     * @param serviceId - Service ID to find
     * @param authToken - Authentication token
     * @returns Promise with service details
     */
    async getBridgeService(serviceId, authToken) {
        const response = await this.http.get(`${this.basePath}/services/${serviceId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to get bridge service');
        }
        return response.data;
    }
    /**
     * Find services by bridge ID
     * @param bridgeId - Bridge ID
     * @param authToken - Authentication token
     * @returns Promise with bridge and services details
     */
    async findServicesByBridgeId(bridgeId, authToken) {
        const response = await this.http.get(`${this.basePath}/bridges/${bridgeId}/services`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Bridge or services not found');
        }
        return response.data;
    }
    // ======================
    // HIU Consent APIs
    // ======================
    /**
     * Initialize a consent request
     * @param consentRequest - Consent request details
     * @param authToken - Authentication token
     * @returns Promise with request ID
     */
    async requestConsent(consentRequest, authToken) {
        const response = await this.http.post(this.hiuBasePath, consentRequest, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to request consent');
        }
        return response.data;
    }
    /**
     * Get consent request status
     * @param requestId - Request ID
     * @param authToken - Authentication token
     * @returns Promise with consent status
     */
    async getConsentStatus(consentRequestId, authToken) {
        const response = await this.http.get(`${this.hiuBasePath}/${consentRequestId}/status`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to get consent status');
        }
        return response.data;
    }
    /**
     * Revoke consent
     * @param consentId - Consent ID
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    async revokeConsent(consentId, authToken) {
        const response = await this.http.post(`${this.hiuBasePath}/${consentId}/revoke`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to revoke consent');
        }
        return response.data;
    }
    /**
     * Handle consent notification
     * @param notification - Notification details
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    async handleConsentNotification(notification, authToken) {
        const response = await this.http.post(`${this.hiuBasePath}/on-notify`, notification, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to process consent notification');
        }
        return response.data;
    }
    // ======================
    // Health Information APIs
    // ======================
    /**
     * Request health information
     * @param request - Health information request details
     * @param authToken - Authentication token
     * @returns Promise with request ID
     */
    async requestHealthInformation(request, authToken) {
        const response = await this.http.post(this.healthInfoBasePath, request, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to request health information');
        }
        return response.data;
    }
    /**
     * Handle health information notification
     * @param notification - Notification details
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    async acknowledgeHealthInformation(requestId, status, authToken, error) {
        const response = await this.http.post(`${this.healthInfoBasePath}/on-request`, { requestId, status, ...(error && { error }) }, { headers: { Authorization: `Bearer ${authToken}` } });
        if (response.status === 'ERROR' || !response.data) {
            throw new Error('Failed to acknowledge health information');
        }
        return response.data;
    }
    /**
     * Fetch health information
     * @param requestId - Request ID
     * @param authToken - Authentication token
     * @returns Promise with health information
     */
    async getHealthInformation(requestId, authToken) {
        const response = await this.http.get(`${this.healthInfoBasePath}/fetch/${requestId}`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });
        if (response.status === 'ERROR' || !response.data) {
            const errorMessage = response.error?.message || 'Unknown error';
            throw new Error(`Failed to fetch health information: ${errorMessage}`);
        }
        return response.data;
    }
}
exports.M3Service = M3Service;
//# sourceMappingURL=m3.service.js.map