import { AuthService } from '../services/auth.service';
import { HealthService } from '../services/health.service';
import { ConsentService } from '../services/consent.service';
import type { ABDMConfig, APIResponse } from '../types/common';
import type {
  CreateAbhaRequest,
  CreateAbhaResponse,
  GenerateAadhaarOtpRequest,
  AadhaarOtpResponse
} from '../types/auth';
import type { HealthFacilityRequest, HealthFacilityResponse } from '../types/health';
import type { 
  HealthInformationResponse, 
  ConsentStatusResponse,
  HealthInformationRequest 
} from '../types/consent';
import type { ConsentRequest } from '../types/health';
import { HttpClient } from '../utils/http-client';

/**
 * Main client for interacting with the Ayushman Bharat Digital Mission (ABDM) APIs
 */
export class ABDMClient {
  private http: HttpClient;
  public auth: AuthService;
  public health: HealthService;
  public consent: ConsentService;

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
  constructor(config: ABDMConfig) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('clientId and clientSecret are required in the config object.');
    }

    // Set default values if not provided
    const effectiveConfig: ABDMConfig = {
      useSandbox: true,
      ...config,
    };

    // Set the baseURL based on the environment if not provided
    if (!effectiveConfig.baseUrl) {
      effectiveConfig.baseUrl = effectiveConfig.useSandbox 
        ? 'https://abhasbx.abdm.gov.in' // Sandbox environment
        : 'https://abdm.gov.in'; // Production environment
    }
    
    // Set authBaseURL to baseURL if not provided
    if (!effectiveConfig.authBaseUrl) {
      effectiveConfig.authBaseUrl = effectiveConfig.baseUrl;
    }

    // Initialize HTTP client with configuration
    this.http = new HttpClient({
      clientId: effectiveConfig.clientId,
      clientSecret: effectiveConfig.clientSecret,
      baseUrl: effectiveConfig.baseUrl,
      authBaseUrl: effectiveConfig.authBaseUrl,
      useSandbox: effectiveConfig.useSandbox,
    });

    // Initialize services
    this.auth = new AuthService(this.http);
    this.health = new HealthService(this.http);
    this.consent = new ConsentService(this.http);
  }

  /**
   * Set a new authentication token
   * @param token - The authentication token
   * @param expiresIn - Optional time in seconds until the token expires (default: 1 hour)
   */
  public setAuthToken(token: string, expiresIn: number = 3600): void {
    if (!this.http) {
      throw new Error('HTTP client not initialized');
    }

    // Set the token using the public setter
    this.http.authToken = token;

    // Calculate expiry time (5 minutes before actual expiry to be safe)
    const expiryTime = Date.now() + (expiresIn - 300) * 1000;
    const expiryDate = new Date(expiryTime);

    // Set the expiry in the http client using the public setter
    this.http.tokenExpiry = expiryDate;
  }

  /**
   * Clear the current authentication token
   */
  public clearAuthToken(): void {
    if (this.http) {
      this.http.authToken = null;
      this.http.tokenExpiry = null;
    }
  }

  /**
   * Get the current authentication token
   * @returns The current authentication token or null if not authenticated
   */
  public getAuthToken(): string | null {
    return this.http.authToken;
  }

  /**
   * Check if the current token is valid
   * @returns True if the token is valid, false otherwise
   */
  public isTokenValid(): boolean {
    if (!this.http) {
      return false;
    }

    // Use the public getter methods
    const authToken = this.http.authToken;
    const tokenExpiry = this.http.tokenExpiry;

    // If we don't have a token or expiry, it's not valid
    if (!authToken || !tokenExpiry) {
      return false;
    }

    // Check if the token is expired
    // tokenExpiry is already a Date object, so we can compare directly
    const now = new Date();
    // Only log token refresh in non-test environments
    if (process.env['NODE_ENV'] === 'test') {
      // eslint-disable-next-line no-console
      process.stdout.write(`[isTokenValid] now: ${now.getTime()}, tokenExpiry: ${tokenExpiry?.getTime()}\n`);
    }
    return now < tokenExpiry;
  }

  /**
   * Authenticate with ABDM and get an access token
   * @returns A promise that resolves when authentication is complete
   */
  public async authenticate(): Promise<void> {
    await this.http.authenticate();
  }

  /**
   * Generates an OTP for Aadhaar-based authentication
   * @param request The request containing Aadhaar number and other details
   * @returns A promise that resolves to the OTP response
   * @throws {Error} If the request fails or the environment is not supported
   */
  public async generateAadhaarOTP(request: GenerateAadhaarOtpRequest): Promise<APIResponse<AadhaarOtpResponse>> {
    try {
      // Log the attempt to generate Aadhaar OTP (without logging sensitive data)
      console.debug('Generating Aadhaar OTP...');
      
      // Delegate to the auth service implementation
      const response = await this.auth.generateAadhaarOTP(request);
      
      // Log success (without sensitive data)
      console.debug('Successfully generated Aadhaar OTP');
      
      return response;
    } catch (error) {
      // Log the error with context
      console.error('Failed to generate Aadhaar OTP:', error);
      
      // Re-throw the error with consistent formatting
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate Aadhaar OTP due to an unknown error');
    }
  }

  public async createAbhaIdByAadhaar(request: CreateAbhaRequest): Promise<APIResponse<CreateAbhaResponse>> {
    return this.auth.createAbhaIdByAadhaar(request);
  }

  /**
   * Encrypts the given data using the configured encryption method
   * @param data The data to encrypt
   * @returns A promise that resolves to the encrypted data
   */
  public async encrypt(data: string): Promise<string> {
    if (!this.http.encrypt) {
      throw new Error('Encryption is not configured. Make sure to provide an encryption implementation.');
    }
    return this.http.encrypt(data);
  }

  /**
   * Fetches the public key from the ABDM server
   * @returns A promise that resolves to the public key response
   */
  public async getPublicKey(): Promise<APIResponse<{ key: string }>> {
    try {
      const response = await this.http.getPublicKey();
      if (!response) {
        return {
          status: 'ERROR',
          error: {
            code: 'NO_RESPONSE',
            message: 'No response from server when fetching public key'
          }
        };
      }
      return {
        status: 'SUCCESS',
        data: response
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: {
          code: 'PUBLIC_KEY_FETCH_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch public key',
          details: error
        }
      };
    }
  }

  // Health Service Methods
  public async addUpdateHealthFacilityServices(data: HealthFacilityRequest): Promise<HealthFacilityResponse> {
    return this.health.addUpdateHealthFacilityServices(data);
  }

  public async getHealthFacility(facilityId: string): Promise<HealthFacilityResponse> {
    return this.health.getHealthFacility(facilityId);
  }

  public async listHealthFacilities(): Promise<HealthFacilityResponse> {
    return this.health.listHealthFacilities();
  }

  public async updateHealthFacilityStatus(facilityId: string, active: boolean): Promise<APIResponse<{ success: boolean }>> {
    return this.health.updateHealthFacilityStatus(facilityId, active);
  }

  // Consent Service Methods
  public async requestConsent(consentRequest: ConsentRequest, authToken: string): Promise<{ requestId: string }> {
    return this.consent.requestConsent(consentRequest, authToken);
  }

  public async getConsentStatus(consentRequestId: string, authToken: string): Promise<ConsentStatusResponse> {
    return this.consent.getConsentStatus(consentRequestId, authToken);
  }

  public async requestHealthInformation(
    request: HealthInformationRequest,
    authToken: string
  ): Promise<{ requestId: string }> {
    return this.consent.requestHealthInformation(request, authToken);
  }

  public async getHealthInformation(
    requestId: string,
    authToken: string
  ): Promise<HealthInformationResponse> {
    return this.consent.getHealthInformation(requestId, authToken);
  }
}
