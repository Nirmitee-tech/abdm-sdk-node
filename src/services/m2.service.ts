import { HttpClient } from '../utils/http-client';
import type {
  HealthFacilityRequest,
  HealthFacilityResponse,
  GenerateTokenRequest,
  GenerateTokenResponse,
  ABHAProfileResponse,
  ConsentRequest,
  ConsentResponse,
  FetchRecordsOptions,
  HealthRecord,
  HealthRecordsResponse,
} from '../types';

/**
 * Service class for ABDM Milestone 2 APIs
 * Handles health facility management and ABHA profile operations
 */
export class M2Service {
  private http: HttpClient;
  private basePath = '/v1';
  private consentBasePath = '/v0.5/consent-requests';

  /**
   * Create a new instance of M2Service
   * @param http - An instance of HttpClient for making API requests
   */
  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Add or update health facility services
   * @param data - Health facility data including HRP details
   * @returns Promise with the API response
   */
  async addUpdateHealthFacilityServices(
    data: HealthFacilityRequest
  ): Promise<HealthFacilityResponse['data']> {
    const response = await this.http.post<HealthFacilityResponse['data']>(
      `${this.basePath}/bridges/MutipleHRPAddUpdateServices`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to update health facility services');
    }
    return response.data;
  }

  /**
   * Generate a token for ABHA profile access
   * @param data - Token generation request data
   * @returns Promise with token response
   */
  async generateToken(data: GenerateTokenRequest): Promise<GenerateTokenResponse['data']> {
    const response = await this.http.post<GenerateTokenResponse['data']>(
      `${this.basePath}/hip/token/generate-token`,
      data
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to generate token');
    }
    return response.data;
  }

  /**
   * Get ABHA profile information
   * @param token - Authentication token
   * @returns Promise with ABHA profile data
   */
  async getABHAProfile(token: string): Promise<ABHAProfileResponse['data']> {
    const response = await this.http.get<ABHAProfileResponse['data']>(
      `${this.basePath}/profile/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to get ABHA profile');
    }
    return response.data;
  }

  /**
   * Verify ABHA address
   * @param abhaAddress - The ABHA address to verify
   * @returns Promise with verification status
   */
  async verifyABHAAddress(abhaAddress: string): Promise<{ exists: boolean }> {
    const response = await this.http.get<{ exists: boolean }>(
      `${this.basePath}/abha/address/verify?abhaAddress=${encodeURIComponent(abhaAddress)}`
    );
    if (!response.success || response.data === undefined) {
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
  async linkABHAAddress(
    abhaNumber: string,
    abhaAddress: string,
    token: string
  ): Promise<{ txnId: string }> {
    const response = await this.http.post<{ txnId: string }>(
      `${this.basePath}/abha/address/link`,
      { abhaNumber, abhaAddress },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to link ABHA address');
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
  async getHealthFacility(facilityId: string): Promise<HealthFacilityResponse['data']> {
    const response = await this.http.get<HealthFacilityResponse['data']>(
      `${this.basePath}/facilities/${facilityId}`
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to get health facility');
    }
    return response.data;
  }

  /**
   * List all health facilities
   * @returns Promise with list of health facilities
   */
  async listHealthFacilities(): Promise<HealthFacilityResponse['data'][]> {
    const response = await this.http.get<HealthFacilityResponse['data'][]>(
      `${this.basePath}/facilities`
    );
    if (!response.success || !response.data) {
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
  async updateHealthFacilityStatus(
    facilityId: string,
    active: boolean
  ): Promise<{ success: boolean }> {
    const response = await this.http.put<{ success: boolean }>(
      `${this.basePath}/facilities/${facilityId}/status`,
      { active }
    );
    if (!response.success || !response.data) {
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
  async updateABHAProfile(
    profileData: Partial<ABHAProfileResponse['data']>,
    token: string
  ): Promise<ABHAProfileResponse['data']> {
    const response = await this.http.put<ABHAProfileResponse['data']>(
      `${this.basePath}/profile/me`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to update ABHA profile');
    }
    return response.data;
  }

  /**
   * Search ABHA profiles
   * @param query - Search query
   * @param token - Authentication token
   * @returns Promise with list of matching profiles
   */
  async searchABHAProfiles(query: string, token: string): Promise<ABHAProfileResponse['data'][]> {
    const response = await this.http.get<ABHAProfileResponse['data'][]>(
      `${this.basePath}/profiles/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to search ABHA profiles');
    }
    return response.data;
  }

  /**
   * Get linked ABHA addresses
   * @param abhaNumber - ABHA number
   * @param token - Authentication token
   * @returns Promise with list of linked addresses
   */
  async getABHALinkedAddresses(
    abhaNumber: string,
    token: string
  ): Promise<{ addresses: string[] }> {
    const response = await this.http.get<{ addresses: string[] }>(
      `${this.basePath}/abha/${abhaNumber}/addresses`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to get linked ABHA addresses');
    }
    return response.data;
  }

  // ======================
  // ABHA Address Management
  // ======================

  /**
   * Unlink ABHA address
   * @param abhaAddress - ABHA address to unlink
   * @param token - Authentication token
   * @returns Promise with success status
   */
  async unlinkABHAAddress(abhaAddress: string, token: string): Promise<{ success: boolean }> {
    const response = await this.http.delete<{ success: boolean }>(
      `${this.basePath}/abha/address/${encodeURIComponent(abhaAddress)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to unlink ABHA address');
    }
    return response.data;
  }

  /**
   * Set preferred ABHA address
   * @param abhaAddress - ABHA address to set as preferred
   * @param token - Authentication token
   * @returns Promise with success status
   */
  async setPreferredABHAAddress(abhaAddress: string, token: string): Promise<{ success: boolean }> {
    const response = await this.http.put<{ success: boolean }>(
      `${this.basePath}/abha/address/preferred`,
      { abhaAddress },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to set preferred ABHA address');
    }
    return response.data;
  }

  // ======================
  // Token Management
  // ======================

  /**
   * Refresh access token
   * @param refreshToken - Refresh token
   * @returns Promise with new tokens
   */
  async refreshToken(refreshToken: string): Promise<GenerateTokenResponse['data']> {
    const response = await this.http.post<GenerateTokenResponse['data']>(
      `${this.basePath}/token/refresh`,
      { refreshToken }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to refresh token');
    }
    return response.data;
  }

  /**
   * Revoke access token
   * @param token - Token to revoke
   * @returns Promise with success status
   */
  async revokeToken(token: string): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.basePath}/token/revoke`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to revoke token');
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
  async createConsent(
    consentData: ConsentRequest,
    token: string
  ): Promise<ConsentResponse['data']> {
    const response = await this.http.post<ConsentResponse['data']>(
      this.consentBasePath,
      consentData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.success || !response.data) {
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
  async getConsent(consentId: string, token: string): Promise<ConsentResponse['data']> {
    const response = await this.http.get<ConsentResponse['data']>(
      `${this.consentBasePath}/${consentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
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
  async updateConsent(
    consentId: string,
    updates: Partial<ConsentRequest>,
    token: string
  ): Promise<ConsentResponse['data']> {
    const response = await this.http.put<ConsentResponse['data']>(
      `${this.consentBasePath}/${consentId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.success || !response.data) {
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
  async revokeConsent(consentId: string, token: string): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.consentBasePath}/${consentId}/revoke`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
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
  async fetchHealthRecords(
    patientId: string,
    token: string,
    options: FetchRecordsOptions = {}
  ): Promise<HealthRecordsResponse['data']> {
    const queryParams = new URLSearchParams();
    if (options.fromDate !== undefined) queryParams.append('fromDate', options.fromDate);
    if (options.toDate !== undefined) queryParams.append('toDate', options.toDate);
    if (options.hiTypes?.length) queryParams.append('hiTypes', options.hiTypes.join(','));
    if (options.limit !== undefined) queryParams.append('limit', options.limit.toString());
    if (options.offset !== undefined) queryParams.append('offset', options.offset.toString());

    const response = await this.http.get<HealthRecordsResponse['data']>(
      `${this.basePath}/patients/${patientId}/records?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.success || !response.data) {
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
  async shareHealthRecords(
    recordIds: string[],
    shareWith: string[],
    token: string
  ): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.basePath}/records/share`,
      { recordIds, shareWith },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.success || !response.data) {
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
  async getHealthRecord(recordId: string, token: string): Promise<HealthRecord> {
    const response = await this.http.get<HealthRecord>(`${this.basePath}/records/${recordId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.success || !response.data) {
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
  async initiateAuth(abhaAddress: string): Promise<{ txnId: string }> {
    const response = await this.http.post<{ txnId: string }>(`${this.basePath}/auth/initiate`, {
      abhaAddress,
    });
    if (!response.success || !response.data) {
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
  async verifyAuthOTP(txnId: string, otp: string): Promise<{ token: string }> {
    const response = await this.http.post<{ token: string }>(`${this.basePath}/auth/verify-otp`, {
      txnId,
      otp,
    });
    if (!response.success || !response.data) {
      throw new Error('Failed to verify OTP');
    }
    return response.data;
  }

  /**
   * Resend authentication OTP
   * @param txnId - Transaction ID from initiateAuth
   * @returns Promise with success status
   */
  async resendAuthOTP(txnId: string): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.basePath}/auth/resend-otp`,
      { txnId }
    );
    if (!response.success || !response.data) {
      throw new Error('Failed to resend OTP');
    }
    return response.data;
  }
}
