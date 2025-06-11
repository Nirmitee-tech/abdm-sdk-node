import type { HealthFacilityRequest, HealthFacilityResponse, GenerateTokenRequest, GenerateTokenResponse, ABHAProfileResponse, ConsentRequest, ConsentResponse, FetchRecordsOptions, HealthRecord, HealthRecordsResponse } from '../types';
import type { HttpClient } from '../utils/http-client';
/**
 * Service class for ABDM Milestone 2 APIs
 * Handles health facility management and ABHA profile operations
 */
export declare class M2Service {
    private http;
    private basePath;
    private consentBasePath;
    /**
     * Create a new instance of M2Service
     * @param http - An instance of HttpClient for making API requests
     */
    constructor(http: HttpClient);
    /**
     * Add or update health facility services
     * @param data - Health facility data including HRP details
     * @returns Promise with the API response
     */
    addUpdateHealthFacilityServices(data: HealthFacilityRequest): Promise<HealthFacilityResponse['data']>;
    /**
     * Generate a token for ABHA profile access
     * @param data - Token generation request data
     * @returns Promise with token response
     */
    generateToken(data: GenerateTokenRequest): Promise<GenerateTokenResponse['data']>;
    /**
     * Get ABHA profile information
     * @param token - Authentication token
     * @returns Promise with ABHA profile data
     */
    getABHAProfile(token: string): Promise<ABHAProfileResponse['data']>;
    /**
     * Verify ABHA address
     * @param abhaAddress - The ABHA address to verify
     * @returns Promise with verification status
     */
    verifyABHAAddress(abhaAddress: string): Promise<{
        exists: boolean;
    }>;
    /**
     * Link ABHA address to a health ID
     * @param abhaNumber - The ABHA number
     * @param abhaAddress - The ABHA address to link
     * @param token - Authentication token
     * @returns Promise with linking status
     */
    linkABHAAddress(abhaNumber: string, abhaAddress: string, token: string): Promise<{
        txnId: string;
    }>;
    /**
     * Unlink ABHA address
     * @param abhaAddress - ABHA address to unlink
     * @param token - Authentication token
     * @returns Promise with success status
     */
    unlinkABHAAddress(abhaAddress: string, token: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get linked ABHA addresses
     * @param abhaNumber - ABHA number
     * @param token - Authentication token
     * @returns Promise with list of linked addresses
     */
    getLinkedAddresses(abhaNumber: string, token: string): Promise<{
        addresses: string[];
    }>;
    getABHALinkedAddresses: (abhaNumber: string, token: string) => Promise<{
        addresses: string[];
    }>;
    /**
     * Get health facility details
     * @param facilityId - The ID of the health facility
     * @returns Promise with health facility details
     */
    getHealthFacility(facilityId: string): Promise<HealthFacilityResponse['data']>;
    /**
     * List all health facilities
     * @returns Promise with list of health facilities
     */
    listHealthFacilities(): Promise<HealthFacilityResponse['data'][]>;
    /**
     * Update health facility status
     * @param facilityId - The ID of the health facility
     * @param active - New status (active/inactive)
     * @returns Promise with success status
     */
    updateHealthFacilityStatus(facilityId: string, active: boolean): Promise<{
        success: boolean;
    }>;
    /**
     * Update ABHA profile
     * @param profileData - Profile data to update
     * @param token - Authentication token
     * @returns Promise with updated profile data
     */
    updateABHAProfile(profileData: Partial<ABHAProfileResponse['data']>, token: string): Promise<ABHAProfileResponse['data']>;
    /**
     * Search ABHA profiles
     * @param criteria - Search criteria or query string
     * @param token - Optional authentication token (for query string search)
     * @returns Promise with list of matching profiles
     */
    searchABHAProfiles(criteria: string | Record<string, any>, token?: string): Promise<ABHAProfileResponse['data'][]>;
    /**
     * Refresh access token
     * @param refreshToken - Refresh token
     * @returns Promise with new tokens
     */
    refreshToken(refreshToken: string): Promise<GenerateTokenResponse['data']>;
    /**
     * Revoke access token
     * @param token - Token to revoke
     * @returns Promise with success status
     */
    revokeToken(token: string): Promise<{
        success: boolean;
    }>;
    /**
     * Generate auth token
     * @param clientId - Client ID
     * @param clientSecret - Client secret
     * @returns Promise with auth token
     */
    generateAuthToken(clientId: string, clientSecret: string): Promise<GenerateTokenResponse['data']>;
    /**
     * Create a new consent
     * @param consentData - Consent data
     * @param token - Authentication token
     * @returns Promise with consent details
     */
    createConsent(consentData: ConsentRequest, token: string): Promise<ConsentResponse['data']>;
    /**
     * Get consent details
     * @param consentId - Consent ID
     * @param token - Authentication token
     * @returns Promise with consent details
     */
    getConsent(consentId: string, token: string): Promise<ConsentResponse['data']>;
    /**
     * Update consent
     * @param consentId - Consent ID
     * @param updates - Consent updates
     * @param token - Authentication token
     * @returns Promise with updated consent details
     */
    updateConsent(consentId: string, updates: Partial<ConsentRequest>, token: string): Promise<ConsentResponse['data']>;
    /**
     * Revoke consent
     * @param consentId - Consent ID
     * @param token - Authentication token
     * @returns Promise with success status
     */
    revokeConsent(consentId: string, token: string): Promise<{
        success: boolean;
    }>;
    /**
     * Fetch health records
     * @param patientId - Patient ID
     * @param token - Authentication token
     * @param options - Fetch options
     * @returns Promise with health records
     */
    fetchHealthRecords(patientId: string, token: string, options?: FetchRecordsOptions): Promise<HealthRecordsResponse['data']>;
    /**
     * Share health records
     * @param recordIds - Array of record IDs to share
     * @param shareWith - Array of recipient IDs
     * @param token - Authentication token
     * @returns Promise with success status
     */
    shareHealthRecords(recordIds: string[], shareWith: string[], token: string): Promise<{
        success: boolean;
    }>;
    /**
     * Get health record by ID
     * @param recordId - Record ID
     * @param token - Authentication token
     * @returns Promise with health record details
     */
    getHealthRecord(recordId: string, token: string): Promise<HealthRecord>;
    /**
     * Initiate authentication
     * @param abhaAddress - ABHA address for authentication
     * @returns Promise with transaction ID
     */
    initiateAuth(abhaAddress: string): Promise<{
        txnId: string;
    }>;
    /**
     * Verify authentication OTP
     * @param txnId - Transaction ID from initiateAuth
     * @param otp - OTP received by the user
     * @returns Promise with authentication token
     */
    verifyAuthOTP(txnId: string, otp: string): Promise<{
        token: string;
    }>;
    /**
     * Resend authentication OTP
     * @param txnId - Transaction ID from initiateAuth
     * @returns Promise with success status
     */
    resendAuthOTP(txnId: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=m2.service.d.ts.map