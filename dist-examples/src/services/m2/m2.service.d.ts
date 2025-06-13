import { HttpClient } from '../../utils/http-client';
import { HealthFacilityRequest, HealthFacilityResponse, GenerateTokenRequest, GenerateTokenData, ConsentRequest, ConsentResponse, HealthRecordsResponse, ABHAProfileResponse, M2ABHAProfileData, FetchRecordsOptions, HealthRecord } from '../../types/m2/m2';
import type { APIResponse } from '../../types/common';
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
    addUpdateHealthFacilityServices(data: HealthFacilityRequest): Promise<HealthFacilityResponse>;
    /**
     * Generate a token for ABHA profile access
     * @param data - Token generation request data
     * @returns Promise with token response
     * @deprecated Token generation is now handled by the HttpClient using client credentials
     */
    generateToken(_data: GenerateTokenRequest): Promise<APIResponse<GenerateTokenData>>;
    /**
     * Get ABHA profile information
     * @param token - Authentication token
     * @returns Promise with ABHA profile data
     */
    getABHAProfile(token: string): Promise<ABHAProfileResponse>;
    /**
     * Verify ABHA address
     * @param abhaAddress - The ABHA address to verify
     * @returns Promise with verification status
     */
    verifyABHAAddress(abhaAddress: string): Promise<APIResponse<{
        exists: boolean;
    }>>;
    /**
     * Link ABHA address to a health ID
     * @param abhaNumber - The ABHA number
     * @param abhaAddress - The ABHA address to link
     * @param token - Authentication token
     * @returns Promise with linking status
     */
    linkABHAAddress(abhaNumber: string, abhaAddress: string, token: string): Promise<APIResponse<{
        txnId: string;
    }>>;
    /**
     * Unlink ABHA address
     * @param abhaAddress - ABHA address to unlink
     * @param token - Authentication token
     * @returns Promise with success status
     */
    unlinkABHAAddress(abhaAddress: string, token: string): Promise<APIResponse<{
        success: boolean;
    }>>;
    /**
     * Get linked ABHA addresses
     * @param abhaNumber - ABHA number
     * @param token - Authentication token
     * @returns Promise with list of linked addresses
     */
    getLinkedAddresses(abhaNumber: string, token: string): Promise<APIResponse<{
        addresses: string[];
    }>>;
    getABHALinkedAddresses: (abhaNumber: string, token: string) => Promise<APIResponse<{
        addresses: string[];
    }>>;
    /**
     * Get health facility details
     * @param facilityId - The ID of the health facility
     * @returns Promise with health facility details
     */
    getHealthFacility(facilityId: string): Promise<HealthFacilityResponse>;
    /**
     * List all health facilities
     * @returns Promise with list of health facilities
     */
    listHealthFacilities(): Promise<HealthFacilityResponse>;
    /**
     * Update health facility status
     * @param facilityId - The ID of the health facility
     * @param active - New status (active/inactive)
     * @returns Promise with success status
     */
    updateHealthFacilityStatus(facilityId: string, active: boolean): Promise<APIResponse<{
        success: boolean;
    }>>;
    /**
     * Update ABHA profile
     * @param profileData - Profile data to update
     * @param token - Authentication token
     * @returns Promise with updated profile data
     */
    updateABHAProfile(profileData: Partial<M2ABHAProfileData>, token: string): Promise<ABHAProfileResponse>;
    /**
     * Search ABHA profiles
     * @param criteria - Search criteria or query string
     * @param token - Optional authentication token (for query string search)
     * @returns Promise with list of matching profiles
     */
    searchABHAProfiles(criteria: string | Record<string, any>, token?: string): Promise<APIResponse<M2ABHAProfileData[]>>;
    /**
     * Refresh access token
     * @param refreshToken - Refresh token
     * @returns Promise with new tokens
     */
    refreshToken(refreshToken: string): Promise<APIResponse<GenerateTokenData>>;
    /**
     * Revoke access token
     * @param token - Token to revoke
     * @returns Promise with success status
     */
    revokeToken(token: string): Promise<APIResponse<{
        success: boolean;
    }>>;
    /**
  
    // ======================
    // Consent Management
    // ======================
  
    /**
     * Create a new consent
     * @param consentData - Consent data
     * @param token - Authentication token
     * @returns Promise with consent details
     */
    createConsent(consentData: ConsentRequest, token: string): Promise<APIResponse<ConsentResponse['data']>>;
    /**
     * Get consent details
     * @param consentId - Consent ID
     * @param token - Authentication token
     * @returns Promise with consent details
     */
    getConsent(consentId: string, token: string): Promise<APIResponse<ConsentResponse['data']>>;
    /**
     * Update consent
     * @param consentId - Consent ID
     * @param updates - Consent updates
     * @param token - Authentication token
     * @returns Promise with updated consent details
     */
    updateConsent(consentId: string, updates: Partial<ConsentRequest>, token: string): Promise<APIResponse<ConsentResponse['data']>>;
    /**
     * Revoke consent
     * @param consentId - Consent ID
     * @param token - Authentication token
     * @returns Promise with success status
     */
    revokeConsent(consentId: string, token: string): Promise<APIResponse<{
        success: boolean;
    }>>;
    /**
     * Fetch health records
     * @param patientId - Patient ID
     * @param token - Authentication token
     * @param options - Fetch options
     * @returns Promise with health records
     */
    fetchHealthRecords(patientId: string, token: string, options?: FetchRecordsOptions): Promise<APIResponse<HealthRecordsResponse>>;
    /**
     * Share health records
     * @param recordIds - Array of record IDs to share
     * @param shareWith - Array of recipient IDs
     * @param token - Authentication token
     * @returns Promise with success status
     */
    shareHealthRecords(recordIds: string[], shareWith: string[], token: string): Promise<APIResponse<{
        success: boolean;
    }>>;
    /**
     * Get health record by ID
     * @param recordId - Record ID
     * @param token - Authentication token
     * @returns Promise with health record details
     */
    getHealthRecord(recordId: string, token: string): Promise<APIResponse<HealthRecord>>;
    /**
     * Initiate authentication
     * @param abhaAddress - ABHA address for authentication
     * @returns Promise with transaction ID
     */
    initiateAuth(abhaAddress: string): Promise<APIResponse<{
        txnId: string;
    }>>;
    /**
     * Verify authentication OTP
     * @param txnId - Transaction ID from initiateAuth
     * @param otp - OTP received by the user
     * @returns Promise with authentication token
     */
    verifyAuthOTP(txnId: string, otp: string): Promise<APIResponse<{
        success: boolean;
        token: string;
    }>>;
    /**
     * Resend authentication OTP
     * @param txnId - Transaction ID from initiateAuth
     * @returns Promise with success status
     */
    resendAuthOTP(txnId: string): Promise<APIResponse<{
        success: boolean;
    }>>;
}
//# sourceMappingURL=m2.service.d.ts.map