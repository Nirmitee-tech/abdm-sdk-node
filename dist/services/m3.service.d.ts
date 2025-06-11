import type { M3SessionResponse, BridgeServiceRegistrationRequest, BridgeServiceResponse, BridgeServicesResponse, M3ConsentRequest, ConsentStatusResponse, HealthInformationRequest, HealthInformationResponse } from '../types/m3';
import type { HttpClient } from '../utils/http-client';
/**
 * Service class for ABDM Milestone 3 APIs
 * Handles HIU (Health Information User) operations and bridge service management
 */
export declare class M3Service {
    private http;
    private basePath;
    private hiuBasePath;
    private healthInfoBasePath;
    /**
     * Create a new instance of M3Service
     * @param http - An instance of HttpClient for making API requests
     */
    constructor(http: HttpClient);
    /**
     * Create a new session
     * @param clientId - Client ID
     * @param clientSecret - Client secret
     * @returns Promise with session details
     */
    createSession(clientId: string, clientSecret: string): Promise<M3SessionResponse>;
    /**
     * Update bridge URL
     * @param bridgeId - Bridge ID
     * @param url - New bridge URL
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    updateBridgeUrl(bridgeId: string, url: string, authToken: string): Promise<{
        success: boolean;
    }>;
    /**
     * Register a new bridge service (HIP/HIU)
     * @param service - Service details
     * @param authToken - Authentication token
     * @returns Promise with registered service details
     */
    registerBridgeService(service: BridgeServiceRegistrationRequest, authToken: string): Promise<BridgeServiceResponse>;
    /**
     * Find bridge service by service ID
     * @param serviceId - Service ID to find
     * @param authToken - Authentication token
     * @returns Promise with service details
     */
    getBridgeService(serviceId: string, authToken: string): Promise<BridgeServiceResponse>;
    /**
     * Find services by bridge ID
     * @param bridgeId - Bridge ID
     * @param authToken - Authentication token
     * @returns Promise with bridge and services details
     */
    findServicesByBridgeId(bridgeId: string, authToken: string): Promise<BridgeServicesResponse>;
    /**
     * Initialize a consent request
     * @param consentRequest - Consent request details
     * @param authToken - Authentication token
     * @returns Promise with request ID
     */
    requestConsent(consentRequest: M3ConsentRequest, authToken: string): Promise<{
        requestId: string;
    }>;
    /**
     * Get consent request status
     * @param requestId - Request ID
     * @param authToken - Authentication token
     * @returns Promise with consent status
     */
    getConsentStatus(consentRequestId: string, authToken: string): Promise<ConsentStatusResponse>;
    /**
     * Revoke consent
     * @param consentId - Consent ID
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    revokeConsent(consentId: string, authToken: string): Promise<{
        success: boolean;
    }>;
    /**
     * Handle consent notification
     * @param notification - Notification details
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    handleConsentNotification(notification: {
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
    }, authToken: string): Promise<{
        success: boolean;
    }>;
    /**
     * Request health information
     * @param request - Health information request details
     * @param authToken - Authentication token
     * @returns Promise with request ID
     */
    requestHealthInformation(request: HealthInformationRequest, authToken: string): Promise<{
        requestId: string;
    }>;
    /**
     * Handle health information notification
     * @param notification - Notification details
     * @param authToken - Authentication token
     * @returns Promise with success status
     */
    acknowledgeHealthInformation(requestId: string, status: 'OK' | 'ERROR', authToken: string, error?: {
        code: string;
        message: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Fetch health information
     * @param requestId - Request ID
     * @param authToken - Authentication token
     * @returns Promise with health information
     */
    getHealthInformation(requestId: string, authToken: string): Promise<HealthInformationResponse>;
}
//# sourceMappingURL=m3.service.d.ts.map