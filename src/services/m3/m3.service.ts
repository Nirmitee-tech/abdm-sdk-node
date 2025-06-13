import type {
  M3SessionResponse,
  BridgeServiceRegistrationRequest,
  BridgeServiceResponse,
  BridgeServicesResponse,
  M3ConsentRequest,
  ConsentStatusResponse,
  HealthInformationRequest,
  HealthInformationResponse,
} from '../../types/m3/m3';
import type { HttpClient } from '../../utils/http-client';

/**
 * Service class for ABDM Milestone 3 APIs
 * Handles HIU (Health Information User) operations and bridge service management
 */
export class M3Service {
  private http: HttpClient;
  private basePath = '/v3';
  private hiuBasePath = '/v3/consent-requests';
  private healthInfoBasePath = '/v3/health-information';

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
   * @deprecated Sessions are now managed automatically by the HttpClient
   */
  async createSession(_clientId: string, _clientSecret: string): Promise<M3SessionResponse> {
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
  async updateBridgeUrl(bridgeId: string, url: string, authToken: string): Promise<{ success: boolean }> {
    const response = await this.http.patch<{ success: boolean }>(
      `${this.basePath}/bridges/${bridgeId}`,
      { url },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
  async registerBridgeService(
    service: BridgeServiceRegistrationRequest,
    authToken: string
  ): Promise<BridgeServiceResponse> {
    const response = await this.http.post<BridgeServiceResponse>(`${this.basePath}/services`, service, {
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
  async getBridgeService(serviceId: string, authToken: string): Promise<BridgeServiceResponse> {
    const response = await this.http.get<BridgeServiceResponse>(`${this.basePath}/services/${serviceId}`, {
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
  async findServicesByBridgeId(bridgeId: string, authToken: string): Promise<BridgeServicesResponse> {
    const response = await this.http.get<BridgeServicesResponse>(`${this.basePath}/bridges/${bridgeId}/services`, {
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
  async requestConsent(consentRequest: M3ConsentRequest, authToken: string): Promise<{ requestId: string }> {
    const response = await this.http.post<{ requestId: string }>(this.hiuBasePath, consentRequest, {
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
  async getConsentStatus(consentRequestId: string, authToken: string): Promise<ConsentStatusResponse> {
    const response = await this.http.get<ConsentStatusResponse>(`${this.hiuBasePath}/${consentRequestId}/status`, {
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
  async revokeConsent(consentId: string, authToken: string): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.hiuBasePath}/${consentId}/revoke`,
      {},
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
    const response = await this.http.post<{ success: boolean }>(`${this.hiuBasePath}/on-notify`, notification, {
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
  async requestHealthInformation(request: HealthInformationRequest, authToken: string): Promise<{ requestId: string }> {
    const response = await this.http.post<{ requestId: string }>(this.healthInfoBasePath, request, {
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
  async acknowledgeHealthInformation(
    requestId: string,
    status: 'OK' | 'ERROR',
    authToken: string,
    error?: { code: string; message: string }
  ): Promise<{ success: boolean }> {
    const response = await this.http.post<{ success: boolean }>(
      `${this.healthInfoBasePath}/on-request`,
      { requestId, status, ...(error && { error }) },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
  async getHealthInformation(requestId: string, authToken: string): Promise<HealthInformationResponse> {
    const response = await this.http.get<HealthInformationResponse>(`${this.healthInfoBasePath}/fetch/${requestId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.status === 'ERROR' || !response.data) {
      const errorMessage = (response as any).error?.message || 'Unknown error';
      throw new Error(`Failed to fetch health information: ${errorMessage}`);
    }

    return response.data;
  }
}
