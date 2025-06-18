import { HttpClient } from '../utils/http-client';
import type { 
  ConsentStatusResponse, 
  HealthInformationRequest, 
  HealthInformationResponse,
  BridgeServiceRegistrationRequest,
  BridgeServiceResponse,
  BridgeServicesResponse
} from '../types/consent';
import type { ConsentRequest } from '../types/health';

// Logger implementation - using console directly

/**
 * Service for handling consent and health information operations
 */
export class ConsentService {
  private http: HttpClient;
  private basePath = '/v3';
  private hiuBasePath = '/v3/consent-requests';
  private healthInfoBasePath = '/v3/health-information';

  /**
   * Create a new instance of ConsentService
   * @param http - An instance of HttpClient for making API requests
   */
  constructor(http: HttpClient) {
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
  async requestConsent(consentRequest: ConsentRequest, authToken: string): Promise<{ requestId: string }> {
    const response = await this.http.post<{ requestId: string }>(
      this.hiuBasePath, 
      consentRequest,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
  async getConsentStatus(consentRequestId: string, authToken: string): Promise<ConsentStatusResponse> {
    const response = await this.http.get<ConsentStatusResponse>(
      `${this.hiuBasePath}/${consentRequestId}/status`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
  async requestHealthInformation(
    request: HealthInformationRequest,
    authToken: string
  ): Promise<{ requestId: string }> {
    const response = await this.http.post<{ requestId: string }>(
      this.healthInfoBasePath,
      request,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
  async getHealthInformation(
    requestId: string,
    authToken: string
  ): Promise<HealthInformationResponse> {
    const response = await this.http.get<HealthInformationResponse>(
      `${this.healthInfoBasePath}/${requestId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
  async registerBridgeService(
    request: BridgeServiceRegistrationRequest,
    authToken: string
  ): Promise<BridgeServiceResponse> {
    const response = await this.http.post<BridgeServiceResponse>(
      `${this.basePath}/bridges`,
      request,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

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
  async listBridgeServices(authToken: string): Promise<BridgeServicesResponse> {
    const response = await this.http.get<BridgeServicesResponse>(
      `${this.basePath}/bridges`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.status === 'ERROR' || !response.data) {
      throw new Error('Failed to list bridge services');
    }

    return response.data;
  }
}

export default ConsentService;
