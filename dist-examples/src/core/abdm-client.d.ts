import type { ABDMConfig, APIResponse } from '../types/common';
import type { SessionRequest, GenerateOtpRequest, GenerateOtpResponse, CreateAbhaRequest, CreateAbhaResponse } from '../types/m1/m1';
import type { HealthFacilityRequest, HealthFacilityResponse } from '../types/m2/m2';
import type { HealthInformationResponse, ConsentStatusResponse, M3ConsentRequest } from '../types/m3/m3';
/**
 * Main client for interacting with the Ayushman Bharat Digital Mission (ABDM) APIs
 */
export declare class ABDMClient {
    private http;
    private m1;
    private m2;
    private m3;
    /**
     * Create a new ABDM client
     * @param config - Configuration for the ABDM client
     */
    /**
     * Create a new ABDM client
     * @param config - Configuration for the ABDM client
     * @example
     * // Basic usage with required config
     * const client = new ABDMClient({
     *   clientId: 'your-client-id',
     *   clientSecret: 'your-client-secret',
     *   baseUrl: 'https://dev.abdm.gov.in/gateway', // optional
     *   authBaseUrl: 'https://dev.abdm.gov.in/gateway', // optional
     *   useSandbox: true, // optional, defaults to true
     * });
     */
    constructor(config: ABDMConfig);
    /**
     * Set a new authentication token
     * @param token - The authentication token
     * @param expiresIn - Optional time in seconds until the token expires (default: 1 hour)
     */
    setAuthToken(token: string, expiresIn?: number): void;
    /**
     * Clear the current authentication token
     */
    clearAuthToken(): void;
    /**
     * Get the current authentication token
     * @returns The current authentication token or null if not authenticated
     */
    getAuthToken(): string | null;
    /**
     * Check if the current token is valid
     * @returns True if the token is valid, false otherwise
     */
    isTokenValid(): boolean;
    /**
     * Authenticate with ABDM and get an access token
     * @returns A promise that resolves when authentication is complete
     */
    authenticate(): Promise<void>;
    getSession(sessionRequest: SessionRequest): Promise<APIResponse<any>>;
    generateOTP(generateOtpRequest: GenerateOtpRequest): Promise<APIResponse<GenerateOtpResponse>>;
    createAbhaIdByAadhaar(createAbhaRequest: CreateAbhaRequest): Promise<APIResponse<CreateAbhaResponse>>;
    getPublicKey(): Promise<APIResponse<{
        key: string;
    }>>;
    addUpdateHealthFacilityServices(data: HealthFacilityRequest): Promise<HealthFacilityResponse>;
    getHealthInformation(requestId: string, authToken: string): Promise<HealthInformationResponse>;
    getConsentStatus(consentRequestId: string, authToken: string): Promise<ConsentStatusResponse>;
    requestConsent(consentRequest: M3ConsentRequest, authToken: string): Promise<{
        requestId: string;
    }>;
    revokeConsent(consentId: string, authToken: string): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=abdm-client.d.ts.map