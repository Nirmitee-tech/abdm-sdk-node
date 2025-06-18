"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
// Logger implementation - using console directly
/**
 * Service for health-related operations including facility management and health records
 */
class HealthService {
    /**
     * Create a new instance of HealthService
     * @param http - An instance of HttpClient for making API requests
     */
    constructor(http, baseUrl = '') {
        this.basePath = '/v3';
        this.consentBasePath = '/v3/consent-requests';
        // Alias for backward compatibility
        this.getABHALinkedAddresses = this.getLinkedAddresses;
        this.http = http;
        this.baseUrl = baseUrl;
    }
    // ======================
    // Health Facility Methods
    // ======================
    /**
     * Add or update health facility services
     * @param data - Health facility data including HRP details
     * @returns Promise with the API response
     */
    async addUpdateHealthFacilityServices(data) {
        const response = await this.http.post(`${this.basePath}/bridges/MutipleHRPAddUpdateServices`, data);
        if (response.status === 'ERROR') {
            throw new Error('Failed to add/update health facility: ' + response.error?.message);
        }
        return response;
    }
    /**
     * Get health facility details
     * @param facilityId - The ID of the health facility
     * @returns Promise with health facility details
     */
    async getHealthFacility(facilityId) {
        const response = await this.http.get(`${this.basePath}/facilities/${facilityId}`);
        if (response.status === 'ERROR') {
            throw new Error('Failed to get health facility: ' + response.error?.message);
        }
        return { ...response, data: response.data };
    }
    /**
     * List all health facilities
     * @returns Promise with list of health facilities
     */
    async listHealthFacilities() {
        const response = await this.http.get(`${this.basePath}/facilities`);
        if (response.status === 'ERROR') {
            throw new Error('Failed to list health facilities: ' + response.error?.message);
        }
        return response;
    }
    /**
     * Update health facility status
     * @param facilityId - The ID of the health facility
     * @param active - New status (active/inactive)
     * @returns Promise with success status
     */
    async updateHealthFacilityStatus(facilityId, active) {
        const response = await this.http.put(`${this.basePath}/facilities/${facilityId}/status`, { active });
        if (response.status === 'ERROR') {
            throw new Error('Failed to update health facility status: ' + response.error?.message);
        }
        return response;
    }
    // ======================
    // Consent Methods
    // ======================
    /**
     * Create a new consent request
     * @param consentRequest - Consent request details
     * @param token - Authentication token
     * @returns Promise with consent response
     */
    async createConsent(consentRequest, token) {
        const response = await this.http.post(`${this.baseUrl}${this.consentBasePath}`, consentRequest, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response;
    }
    /**
     * Get consent details
     * @param consentId - Consent ID
     * @param token - Authentication token
     * @returns Promise with consent details
     */
    async getConsent(consentId, token) {
        return await this.http.get(`${this.baseUrl}${this.consentBasePath}/${consentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
    // ======================
    // Health Records Methods
    // ======================
    /**
     * Fetch health records
     * @param patientId - Patient ID
     * @param token - Authentication token
     * @param options - Fetch options
     * @returns Promise with health records
     */
    async fetchHealthRecords(patientId, token, options) {
        const params = {
            patientId,
        };
        if (options?.['fromDate'])
            params['fromDate'] = options['fromDate'];
        if (options?.['toDate'])
            params['toDate'] = options['toDate'];
        if (options?.['hiTypes'])
            params['hiTypes'] = options['hiTypes'].join(',');
        if (options?.['category'])
            params['category'] = options['category'];
        if (options?.['type'])
            params['type'] = options['type'];
        if (options?.['limit'])
            params['limit'] = options['limit'].toString();
        if (options?.['offset'])
            params['offset'] = options['offset'].toString();
        const queryParams = new URLSearchParams(params);
        return this.http.get(`${this.basePath}/health-records?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }
    /**
     * Get health record by ID
     * @param recordId - Record ID
     * @param token - Authentication token
     * @returns Promise with health record details
     */
    async getHealthRecord(recordId, token) {
        const response = await this.http.get(`${this.basePath}/health-records/${recordId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 'ERROR') {
            throw new Error(response.error?.message || 'Failed to get health record');
        }
        return response;
    }
    // ======================
    // ABHA Profile Methods
    // ======================
    /**
     * Get ABHA profile
     * @param abhaNumber - ABHA number
     * @param token - Authentication token
     * @returns Promise with ABHA profile data
     */
    async getABHAProfile(abhaNumber, token) {
        const response = await this.http.get(`${this.basePath}/profile/${abhaNumber}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 'ERROR') {
            throw new Error('Failed to get ABHA profile: ' + response.error?.message);
        }
        return response;
    }
    /**
     * Update ABHA profile
     * @param profileData - Profile data to update
     * @param token - Authentication token
     * @returns Promise with updated profile data
     */
    async updateABHAProfile(profileData, token) {
        const response = await this.http.put(`${this.basePath}/profile/me`, profileData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 'ERROR') {
            throw new Error('Failed to update ABHA profile: ' + response.error?.message);
        }
        return response;
    }
    /**
     * Get linked ABHA addresses
     * @param abhaNumber - ABHA number
     * @param token - Authentication token
     * @returns Promise with list of linked addresses
     */
    async getLinkedAddresses(abhaNumber, token) {
        const response = await this.http.get(`${this.basePath}/abha/address/linked-addresses?abhaNumber=${encodeURIComponent(abhaNumber)}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status === 'ERROR') {
            throw new Error('Failed to get linked addresses: ' + response.error?.message);
        }
        return response;
    }
}
exports.HealthService = HealthService;
exports.default = HealthService;
//# sourceMappingURL=health.service.js.map