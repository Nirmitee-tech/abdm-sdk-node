import { HttpClient } from '../utils/http-client';
import type {
  M3SessionRequest,
  M3SessionResponse,
  BridgeServiceRegistrationRequest,
  BridgeServiceResponse,
  BridgeServicesResponse,
  M3ConsentRequest,
  ConsentStatusResponse,
  HealthInformationRequest,
  HealthInformationResponse,
  HealthInformationNotification,
} from '../types/m3';

/**
 * Service class for ABDM Milestone 3 APIs
 * Handles HIU (Health Information User) operations and bridge service management
 */
export class M3Service {
  private http: HttpClient;
  private basePath = '/v3';
  private hiuBasePath = '/v0.5/consent-requests';
  private healthInfoBasePath = '/v0.5/health-information';

  /**
   * Create a new instance of M3Service
   * @param http - An instance of HttpClient for making API requests
   */
  constructor(http: HttpClient) {
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
   */
  async createSession(clientId: string, clientSecret: string): Promise<M3SessionResponse> {
    const data: M3SessionRequest = {
      clientId,
      clientSecret,
      grantType: 'client_credentials',
    };

    const response = await this.http.post<M3SessionResponse>(`${this.basePath}/sessions`, data);

    if (!response.success || !response.data) {
      throw new Error('Failed to create session');
    }

    return response.data;
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
  async updateBridgeUrl(
    bridgeId: string,
    url: string,
    authToken: string
  ): Promise<{ success: boolean }> {
    const response = await this.http.patch<{ success: boolean }>(
      `${this.basePath}/bridges/${bridgeId}`,
      { url },
      { authToken }
    );

    if (!response.success || !response.data) {
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
  async registerBridgeService(
    service: BridgeServiceRegistrationRequest,
    authToken: string
  ): Promise<BridgeServiceResponse> {
    const response = await this.http.post<BridgeServiceResponse>(
      `${this.basePath}/services`,
      service,
      { authToken }
    );

    if (!response.success || !response.data) {
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
  async findBridgeServiceById(
    serviceId: string,
    authToken: string
  ): Promise<BridgeServiceResponse> {
    const response = await this.http.get<BridgeServiceResponse>(
      `${this.basePath}/services/${serviceId}`,
      { authToken }
    );

    if (!response.success || !response.data) {
      throw new Error('Service not found');
    }

    return response.data;
  }

  /**
   * Find services by bridge ID
   * @param bridgeId - Bridge ID
   * @param authToken - Authentication token
   * @returns Promise with bridge and services details
   */
  async findServicesByBridgeId(
    bridgeId: string,
    authToken: string
  ): Promise<BridgeServicesResponse> {
    const response = await this.http.get<BridgeServicesResponse>(
      `${this.basePath}/bridges/${bridgeId}/services`,
      { authToken }
    );

    if (!response.success || !response.data) {
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
  async initConsentRequest(
    consentRequest: M3ConsentRequest,
    authToken: string
  ): Promise<{ requestId: string }> {
    const response = await this.http.post<{ requestId: string }>(
      `${this.hiuBasePath}/init`,
      consentRequest,
      { authToken }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to initialize consent request');
    }

    return response.data;
  }

  /**
   * Get consent request status
   * @param requestId - Request ID
   * @param authToken - Authentication token
   * @returns Promise with consent status
   */
  async getConsentRequestStatus(
    requestId: string,
    authToken: string
  ): Promise<ConsentStatusResponse> {
    const response = await this.http.get<ConsentStatusResponse>(
      `${this.hiuBasePath}/status/${requestId}`,
      { authToken }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to get consent request status');
    }

    return response.data;
  }

  /**
   * Handle consent notification
   * @param notification - Notification details
   * @param authToken - Authentication token
   * @returns Promise with success status
   */
  async handleConsentNotification(
    notification: {
      requestId: string;
      timestamp: string;
      notification: {
        consentRequestId: string;
        status: 'GRANTED' | 'DENIED' | 'EXPIRED' | 'FAILED';
        signature: string;
        consentArtefacts?: Array<{
          id: string;
          status: 'GRANTED' | 'REVOKED' | 'EXPIRED';
          signature: string;
        }>;
      };
    },
    authToken: string
  ): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.hiuBasePath}/on-notify`,
      notification,
      { authToken }
    );

    if (!response.success || !response.data) {
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
  async requestHealthInformation(
    request: HealthInformationRequest,
    authToken: string
  ): Promise<{ requestId: string }> {
    const response = await this.http.post<{ requestId: string }>(
      `${this.healthInfoBasePath}/request`,
      request,
      { authToken }
    );

    if (!response.success || !response.data) {
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
  async handleHealthInformationNotification(
    notification: HealthInformationNotification,
    authToken: string
  ): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.healthInfoBasePath}/notify`,
      notification,
      { authToken }
    );

    if (!response.success || !response.data) {
      throw new Error('Failed to process health information notification');
    }

    return response.data;
  }

  /**
   * Fetch health information
   * @param consentId - Consent ID
   * @param token - Authentication token
   * @returns Promise with health information
   */
  async fetchHealthInformation(
    consentId: string,
    token: string
  ): Promise<HealthInformationResponse> {
    const response = await this.http.get<HealthInformationResponse>(
      `${this.healthInfoBasePath}/fetch/${consentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.success || !response.data) {
      throw new Error(
        `Failed to fetch health information: ${response.error?.message || 'Unknown error'}`
      );
    }

    return response.data;
  }
}
