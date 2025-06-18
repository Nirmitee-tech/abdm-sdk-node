import { HttpClient } from '../utils/http-client';
import type { APIResponse } from '../types/common';
import type { 
  HealthFacilityRequest, 
  HealthFacilityResponse, 
  ConsentResponse, 
  HealthRecordsResponse, 
  HealthRecord, 
  ABHAProfileResponse, 
  M2ABHAProfileData,
  FetchRecordsOptions,
  HealthFacilityData,
  ConsentRequest
} from '../types/health';

// Logger implementation - using console directly

/**
 * Service for health-related operations including facility management and health records
 */
export class HealthService {
  private http: HttpClient;
  private baseUrl: string;
  private basePath = '/v3';
  private consentBasePath = '/v3/consent-requests';

  /**
   * Create a new instance of HealthService
   * @param http - An instance of HttpClient for making API requests
   */
  constructor(http: HttpClient, baseUrl: string = '') {
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
  async addUpdateHealthFacilityServices(data: HealthFacilityRequest): Promise<HealthFacilityResponse> {
    const response = await this.http.post<HealthFacilityData>(`${this.basePath}/bridges/MutipleHRPAddUpdateServices`, data);
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
  async getHealthFacility(facilityId: string): Promise<HealthFacilityResponse> {
    const response = await this.http.get<HealthFacilityData>(`${this.basePath}/facilities/${facilityId}`);
    if (response.status === 'ERROR') {
      throw new Error('Failed to get health facility: ' + response.error?.message);
    }
    return { ...response, data: response.data };
  }

  /**
   * List all health facilities
   * @returns Promise with list of health facilities
   */
  async listHealthFacilities(): Promise<HealthFacilityResponse> {
    const response = await this.http.get<HealthFacilityData>(`${this.basePath}/facilities`);
    if (response.status === 'ERROR') {
      throw new Error('Failed to list health facilities: ' + response.error?.message);
    }
    return response as HealthFacilityResponse;
  }

  /**
   * Update health facility status
   * @param facilityId - The ID of the health facility
   * @param active - New status (active/inactive)
   * @returns Promise with success status
   */
  async updateHealthFacilityStatus(facilityId: string, active: boolean): Promise<APIResponse<{ success: boolean }>> {
    const response = await this.http.put<{ success: boolean }>(`${this.basePath}/facilities/${facilityId}/status`, { active });
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
  async createConsent(consentRequest: ConsentRequest, token: string): Promise<APIResponse<ConsentResponse>> {
    const response = await this.http.post<ConsentResponse>(
      `${this.baseUrl}${this.consentBasePath}`,
      consentRequest,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response;
  }

  /**
   * Get consent details
   * @param consentId - Consent ID
   * @param token - Authentication token
   * @returns Promise with consent details
   */
  async getConsent(consentId: string, token: string): Promise<APIResponse<ConsentResponse>> {
    return await this.http.get<ConsentResponse>(
      `${this.baseUrl}${this.consentBasePath}/${consentId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
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
  async fetchHealthRecords(patientId: string, token: string, options?: FetchRecordsOptions): Promise<APIResponse<HealthRecordsResponse>> {
    const params: Record<string, string> = {
      patientId,
    };

    if (options?.['fromDate']) params['fromDate'] = options['fromDate'];
    if (options?.['toDate']) params['toDate'] = options['toDate'];
    if (options?.['hiTypes']) params['hiTypes'] = options['hiTypes'].join(',');
    if (options?.['category']) params['category'] = options['category'];
    if (options?.['type']) params['type'] = options['type'];
    if (options?.['limit']) params['limit'] = options['limit'].toString();
    if (options?.['offset']) params['offset'] = options['offset'].toString();

    const queryParams = new URLSearchParams(params);
    return this.http.get<HealthRecordsResponse>(`${this.basePath}/health-records?${queryParams.toString()}`, {
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
  async getHealthRecord(recordId: string, token: string): Promise<APIResponse<HealthRecord>> {
    const response = await this.http.get<HealthRecord>(`${this.basePath}/health-records/${recordId}`, {
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
  async getABHAProfile(abhaNumber: string, token: string): Promise<ABHAProfileResponse> {
    const response = await this.http.get<M2ABHAProfileData>(`${this.basePath}/profile/${abhaNumber}`, {
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
  async updateABHAProfile(profileData: Partial<M2ABHAProfileData>, token: string): Promise<ABHAProfileResponse> {
    const response = await this.http.put<M2ABHAProfileData>(`${this.basePath}/profile/me`, profileData, {
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
  async getLinkedAddresses(abhaNumber: string, token: string): Promise<APIResponse<{ addresses: string[] }>> {
    const response = await this.http.get<{ addresses: string[] }>(`${this.basePath}/abha/address/linked-addresses?abhaNumber=${encodeURIComponent(abhaNumber)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 'ERROR') {
      throw new Error('Failed to get linked addresses: ' + response.error?.message);
    }
    return response;
  }

  // Alias for backward compatibility
  getABHALinkedAddresses = this.getLinkedAddresses;
}

export default HealthService;
