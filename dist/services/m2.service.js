"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M2Service = void 0;
/**
 * Service class for ABDM Milestone 2 APIs
 * Handles health facility management and ABHA profile operations
 */
class M2Service {
    /**
     * Create a new instance of M2Service
     * @param http - An instance of HttpClient for making API requests
     */
    constructor(http) {
        this.basePath = '/v1';
        this.consentBasePath = '/v0.5/consent-requests';
        // Alias for backward compatibility
        this.getABHALinkedAddresses = this.getLinkedAddresses;
        this.http = http;
    }
    /**
     * Add or update health facility services
     * @param data - Health facility data including HRP details
     * @returns Promise with the API response
     */
    async addUpdateHealthFacilityServices(data) {
        const response = await this.http.post(`${this.basePath}/bridges/MutipleHRPAddUpdateServices`, data);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to update health facility services');
        }
        return response.data;
    }
    /**
     * Generate a token for ABHA profile access
     * @param data - Token generation request data
     * @returns Promise with token response
     */
    async generateToken(data) {
        const response = await this.http.post(`${this.basePath}/hip/token/generate-token`, data);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to generate token');
        }
        return response.data;
    }
    /**
     * Get ABHA profile information
     * @param token - Authentication token
     * @returns Promise with ABHA profile data
     */
    async getABHAProfile(token) {
        const response = await this.http.get(`${this.basePath}/profile/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to get ABHA profile');
        }
        return response.data;
    }
    /**
     * Verify ABHA address
     * @param abhaAddress - The ABHA address to verify
     * @returns Promise with verification status
     */
    async verifyABHAAddress(abhaAddress) {
        const response = await this.http.get(`${this.basePath}/abha/address/verify?abhaAddress=${encodeURIComponent(abhaAddress)}`);
        if (response.status >= 400 || response.data === undefined) {
            throw new Error('Failed to verify ABHA address');
        }
        return response.data;
    }
    /**
     * Link ABHA address to a health ID
     * @param abhaNumber - The ABHA number
     * @param abhaAddress - The ABHA address to link
     * @param token - Authentication token
     * @returns Promise with linking status
     */
    async linkABHAAddress(abhaNumber, abhaAddress, token) {
        const response = await this.http.post(`${this.basePath}/abha/address/link`, { abhaNumber, abhaAddress }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to link ABHA address');
        }
        return response.data;
    }
    /**
     * Unlink ABHA address
     * @param abhaAddress - ABHA address to unlink
     * @param token - Authentication token
     * @returns Promise with success status
     */
    async unlinkABHAAddress(abhaAddress, token) {
        const response = await this.http.post(`${this.basePath}/abha/address/unlink`, { abhaAddress }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to unlink ABHA address');
        }
        return response.data;
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
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to get linked addresses');
        }
        return response.data;
    }
    // ======================
    // Health Facility Management
    // ======================
    /**
     * Get health facility details
     * @param facilityId - The ID of the health facility
     * @returns Promise with health facility details
     */
    async getHealthFacility(facilityId) {
        const response = await this.http.get(`${this.basePath}/facilities/${facilityId}`);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to get health facility');
        }
        return response.data;
    }
    /**
     * List all health facilities
     * @returns Promise with list of health facilities
     */
    async listHealthFacilities() {
        const response = await this.http.get(`${this.basePath}/facilities`);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to list health facilities');
        }
        return response.data;
    }
    /**
     * Update health facility status
     * @param facilityId - The ID of the health facility
     * @param active - New status (active/inactive)
     * @returns Promise with success status
     */
    async updateHealthFacilityStatus(facilityId, active) {
        const response = await this.http.put(`${this.basePath}/facilities/${facilityId}/status`, {
            active,
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to update health facility status');
        }
        return response.data;
    }
    // ======================
    // ABHA Profile Management
    // ======================
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
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to update ABHA profile');
        }
        return response.data;
    }
    /**
     * Search ABHA profiles
     * @param criteria - Search criteria or query string
     * @param token - Optional authentication token (for query string search)
     * @returns Promise with list of matching profiles
     */
    async searchABHAProfiles(criteria, token) {
        if (typeof criteria === 'string' && token) {
            // Handle query string search with token
            const response = await this.http.get(`${this.basePath}/profile/search?query=${encodeURIComponent(criteria)}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status >= 400 || !response.data) {
                throw new Error('Failed to search ABHA profiles');
            }
            return response.data;
        }
        else if (typeof criteria === 'object') {
            // Handle POST request with criteria object
            const response = await this.http.post(`${this.basePath}/profile/search`, criteria);
            if (response.status >= 400 || !response.data) {
                throw new Error('Failed to search ABHA profiles');
            }
            return response.data;
        }
        throw new Error('Invalid search criteria');
    }
    // ======================
    // ABHA Address Management
    // ======================
    // Removed duplicate implementation of unlinkABHAAddress
    // ======================
    // Token Management
    // ======================
    /**
     * Refresh access token
     * @param refreshToken - Refresh token
     * @returns Promise with new tokens
     */
    async refreshToken(refreshToken) {
        const response = await this.http.post(`${this.basePath}/token/refresh`, {
            refreshToken,
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to refresh token');
        }
        return response.data;
    }
    /**
     * Revoke access token
     * @param token - Token to revoke
     * @returns Promise with success status
     */
    async revokeToken(token) {
        const response = await this.http.post(`${this.basePath}/token/revoke`, {}, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to revoke token');
        }
        return response.data;
    }
    /**
     * Generate auth token
     * @param clientId - Client ID
     * @param clientSecret - Client secret
     * @returns Promise with auth token
     */
    async generateAuthToken(clientId, clientSecret) {
        const response = await this.http.post(`${this.basePath}/auth/token`, { clientId, clientSecret }, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to generate auth token');
        }
        return response.data;
    }
    // ======================
    // Consent Management
    // ======================
    /**
     * Create a new consent
     * @param consentData - Consent data
     * @param token - Authentication token
     * @returns Promise with consent details
     */
    async createConsent(consentData, token) {
        const response = await this.http.post(`${this.consentBasePath}`, consentData, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to create consent');
        }
        return response.data;
    }
    /**
     * Get consent details
     * @param consentId - Consent ID
     * @param token - Authentication token
     * @returns Promise with consent details
     */
    async getConsent(consentId, token) {
        const response = await this.http.get(`${this.consentBasePath}/${consentId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to get consent');
        }
        return response.data;
    }
    /**
     * Update consent
     * @param consentId - Consent ID
     * @param updates - Consent updates
     * @param token - Authentication token
     * @returns Promise with updated consent details
     */
    async updateConsent(consentId, updates, token) {
        const response = await this.http.put(`${this.consentBasePath}/${consentId}`, updates, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to update consent');
        }
        return response.data;
    }
    /**
     * Revoke consent
     * @param consentId - Consent ID
     * @param token - Authentication token
     * @returns Promise with success status
     */
    async revokeConsent(consentId, token) {
        const response = await this.http.delete(`${this.consentBasePath}/${consentId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to revoke consent');
        }
        return response.data;
    }
    // ======================
    // Health Records
    // ======================
    /**
     * Fetch health records
     * @param patientId - Patient ID
     * @param token - Authentication token
     * @param options - Fetch options
     * @returns Promise with health records
     */
    async fetchHealthRecords(patientId, token, options = {}) {
        const params = {
            patientId,
        };
        if (options['fromDate'])
            params['fromDate'] = options['fromDate'];
        if (options['toDate'])
            params['toDate'] = options['toDate'];
        if (options['category'])
            params['category'] = options['category'];
        if (options['type'])
            params['type'] = options['type'];
        if (options['limit'])
            params['limit'] = options['limit'].toString();
        if (options['offset'])
            params['offset'] = options['offset'].toString();
        if (options['hiTypes']?.length)
            params['hiTypes'] = options['hiTypes'].join(',');
        const queryParams = new URLSearchParams(params);
        const response = await this.http.get(`${this.basePath}/health-records?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to fetch health records');
        }
        return response.data;
    }
    /**
     * Share health records
     * @param recordIds - Array of record IDs to share
     * @param shareWith - Array of recipient IDs
     * @param token - Authentication token
     * @returns Promise with success status
     */
    async shareHealthRecords(recordIds, shareWith, token) {
        const response = await this.http.post(`${this.basePath}/health-records/share`, { recordIds, shareWith }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to share health records');
        }
        return response.data;
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
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to get health record');
        }
        return response.data;
    }
    // ======================
    // Authentication
    // ======================
    /**
     * Initiate authentication
     * @param abhaAddress - ABHA address for authentication
     * @returns Promise with transaction ID
     */
    async initiateAuth(abhaAddress) {
        const response = await this.http.post(`${this.basePath}/auth/initiate`, {
            abhaAddress,
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to initiate authentication');
        }
        return response.data;
    }
    /**
     * Verify authentication OTP
     * @param txnId - Transaction ID from initiateAuth
     * @param otp - OTP received by the user
     * @returns Promise with authentication token
     */
    async verifyAuthOTP(txnId, otp) {
        const response = await this.http.post(`${this.basePath}/auth/verify-otp`, {
            txnId,
            otp,
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to verify OTP');
        }
        return response.data;
    }
    /**
     * Resend authentication OTP
     * @param txnId - Transaction ID from initiateAuth
     * @returns Promise with success status
     */
    async resendAuthOTP(txnId) {
        const response = await this.http.post(`${this.basePath}/auth/resend-otp`, {
            txnId,
        });
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to resend OTP');
        }
        return response.data;
    }
}
exports.M2Service = M2Service;
//# sourceMappingURL=m2.service.js.map