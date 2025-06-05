import { HttpClient } from '../utils/http-client';
import type { APIResponse } from '../types';
import {
  SessionRequest,
  SessionResponse,
  AadhaarSendOTPRequest,
  AadhaarSendOTPResponse,
  AadhaarVerifyAndCreateABHARequest,
  LegacyABHACreationRequest,
  ABHACreationResponse,
  ABHAProfileData, // Explicitly import for getABHAProfile return type
  UpdateABHAProfileRequest,
  ABHACardResponse,
  ABHAAddressResponse,
  MessageResponse,
  MobileUpdateRequest,
  MobileSendOTPResponse,
  EmailVerificationRequest,
  ABHAAddressRequest,
  CheckABHAAddressExistsRequest,
  CheckABHAAddressExistsResponse,
} from '../types';

export class M1Service {
  private http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Get Gateway Session Token
   * Corresponds to Postman M1: "Session API"
   * Endpoint: https://dev.abdm.gov.in/api/hiecm/gateway/v3/sessions
   */
  async createGatewaySession(
    clientId: string,
    clientSecret: string
  ): Promise<APIResponse<SessionResponse>> {
    const requestBody: SessionRequest = {
      clientId,
      clientSecret,
      grantType: 'client_credentials',
    };
    return this.http.post<SessionResponse>('/api/hiecm/gateway/v3/sessions', requestBody, {
      headers: { 'X-CM-ID': 'sbx' },
    });
  }

  /**
   * ABHA Enrolment: Send OTP for Aadhaar verification
   * Endpoint: https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/request/otp
   */
  async sendAadhaarOTP(unencryptedAadhaar: string): Promise<APIResponse<AadhaarSendOTPResponse>> {
    const encryptedAadhaar = await this.http.encryptWithPublicKey(unencryptedAadhaar);
    const requestBody: AadhaarSendOTPRequest = {
      scope: ['abha-enrol'],
      loginHint: 'aadhaar',
      loginId: encryptedAadhaar,
      otpSystem: 'aadhaar',
    };
    const apiEndpoint = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/request/otp';
    return this.http.post<AadhaarSendOTPResponse>(apiEndpoint, requestBody);
  }

  /**
   * Verify Aadhaar OTP and Create ABHA Account/ID
   * Endpoint: https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/account
   * @param otp OTP received on mobile (plaintext, encryption handled by API if needed, or update type)
   * @param txnId Transaction ID from sendAadhaarOTP response
   * @param preferredAbhaAddress Optional preferred ABHA address to create/claim
   */
  async verifyAadhaarOTPAndCreateABHA(
    otp: string,
    txnId: string,
    preferredAbhaAddress?: string
  ): Promise<APIResponse<ABHACreationResponse>> {
    const apiEndpoint = 'https://abhasbx.abdm.gov.in/abha/api/v3/enrollment/account';
    const requestBody: AadhaarVerifyAndCreateABHARequest = {
      authData: {
        authMethods: ['otp'],
        otp: {
          txnId: txnId,
          otpValue: otp,
        },
      },
      creationType: 'abha-id',
    };
    if (preferredAbhaAddress) {
      requestBody.preferredAbhaAddress = preferredAbhaAddress;
    }
    return this.http.post<ABHACreationResponse>(apiEndpoint, requestBody);
  }

  /**
   * Create ABHA ID with Aadhaar (Legacy/Alternative Flow - Review against Postman)
   * @param data ABHA creation data using LegacyABHACreationRequest
   */
  async createABHAWithAadhaar(
    _data: LegacyABHACreationRequest
  ): Promise<APIResponse<ABHACreationResponse>> {
    console.warn(
      'createABHAWithAadhaar needs review against Postman M1 collection. Endpoint and payload may differ.'
    );
    throw new Error('createABHAWithAadhaar is not implemented or uses an unverified endpoint.');
  }

  /**
   * Send OTP for mobile update
   * @param mobile Mobile number to update
   * @param authToken Specific authentication token for this flow (e.g., X-HIP-ID or user token)
   */
  async sendMobileUpdateOTP(
    mobile: string,
    authToken: string
  ): Promise<APIResponse<MobileSendOTPResponse>> {
    const apiEndpoint = '/v1/account/mobile/otp';
    const requestBody: MobileUpdateRequest = { mobile };
    return this.http.post<MobileSendOTPResponse>(apiEndpoint, requestBody, {
      headers: { 'X-Token': authToken },
    });
  }

  /**
   * Verify mobile update OTP
   * @param otp OTP received on mobile
   * @param txnId Transaction ID from sendMobileUpdateOTP response
   * @param authToken Specific authentication token
   */
  async verifyMobileUpdateOTP(
    otp: string,
    txnId: string,
    authToken: string
  ): Promise<APIResponse<MessageResponse>> {
    const apiEndpoint = '/v1/account/mobile/verify';
    return this.http.post<MessageResponse>(
      apiEndpoint,
      { otp, txnId },
      { headers: { 'X-Token': authToken } }
    );
  }

  /**
   * Send email verification link
   * @param email Email to verify
   * @param authToken Specific authentication token
   */
  async sendEmailVerificationLink(
    email: string,
    authToken: string
  ): Promise<APIResponse<MessageResponse>> {
    const apiEndpoint = '/v1/account/email/send-verification';
    const requestBody: EmailVerificationRequest = { email };
    return this.http.post<MessageResponse>(apiEndpoint, requestBody, {
      headers: { 'X-Token': authToken },
    });
  }

  /**
   * Get ABHA address suggestions
   * @param txnId Transaction ID (usually from an ABHA creation step where user token is obtained)
   * @param authToken User's session token (X-Token)
   */
  async getABHAAddressSuggestions(
    txnId: string,
    authToken: string
  ): Promise<APIResponse<ABHAAddressResponse>> {
    const apiEndpoint = '/v1/account/phr/suggestion';
    return this.http.get<ABHAAddressResponse>(apiEndpoint, {
      params: { txnId },
      headers: { 'X-Token': authToken },
    });
  }

  /**
   * Create ABHA address (Preferred PHR Address)
   * @param abhaAddress Desired ABHA address
   * @param txnId Transaction ID from a preceding step (e.g., account creation)
   * @param authToken User's session token (X-Token)
   * @param preferred Mark as preferred (optional, defaults to true by some APIs)
   */
  async createABHAAddress(
    abhaAddress: string,
    txnId: string,
    authToken: string,
    preferred: boolean = true
  ): Promise<APIResponse<MessageResponse>> {
    const apiEndpoint = '/v1/account/phr-address';
    const requestBody: ABHAAddressRequest = { abhaAddress, preferred, txnId };
    return this.http.post<MessageResponse>(apiEndpoint, requestBody, {
      headers: { 'X-Token': authToken },
    });
  }

  /**
   * Get ABHA Profile
   * Retrieves the ABHA profile details of the authenticated user.
   * Endpoint: https://abhasbx.abdm.gov.in/abha/api/v1/account/profile (Verify Endpoint)
   * @param authToken User's session token (X-Token)
   */
  async getABHAProfile(authToken: string): Promise<APIResponse<ABHAProfileData>> {
    const apiEndpoint = 'https://abhasbx.abdm.gov.in/abha/api/v1/account/profile'; // Verify this endpoint
    return this.http.get<ABHAProfileData>(apiEndpoint, {
      headers: { 'X-Token': authToken },
    });
  }

  /**
   * Update ABHA Profile
   * Updates the ABHA profile details of the authenticated user.
   * Endpoint: https://abhasbx.abdm.gov.in/abha/api/v1/account/profile (Verify Endpoint)
   * @param profileData Data to update
   * @param authToken User's session token (X-Token)
   */
  async updateABHAProfile(
    profileData: UpdateABHAProfileRequest,
    authToken: string
  ): Promise<APIResponse<MessageResponse>> {
    // Or ABHAProfileData if API returns updated profile
    const apiEndpoint = 'https://abhasbx.abdm.gov.in/abha/api/v1/account/profile'; // Verify this endpoint
    return this.http.put<MessageResponse>(apiEndpoint, profileData, {
      headers: { 'X-Token': authToken },
    });
  }

  /**
   * Download ABHA Card
   * Retrieves the user's ABHA card, typically as a base64 encoded string or PDF data.
   * Endpoint: https://abhasbx.abdm.gov.in/abha/api/v1/account/card (Verify Endpoint)
   * @param authToken User's session token (X-Token)
   */
  async downloadABHACard(authToken: string): Promise<APIResponse<ABHACardResponse>> {
    const apiEndpoint = 'https://abhasbx.abdm.gov.in/abha/api/v1/account/card'; // Verify this endpoint
    return this.http.get<ABHACardResponse>(apiEndpoint, {
      headers: { 'X-Token': authToken },
    });
  }

  /**
   * Check if ABHA Address (PHR Address) Exists
   * Endpoint: https://abhasbx.abdm.gov.in/abha/api/v1/account/phr-address/exists-by-phr-address (Verify Endpoint)
   * @param phrAddress The PHR address to check for existence.
   * @param authToken User's session token (X-Token) - may or may not be required depending on API design.
   */
  async checkABHAAddressExists(
    phrAddress: string,
    authToken: string // Optional: Verify if auth is needed for this check
  ): Promise<APIResponse<CheckABHAAddressExistsResponse>> {
    // Verify this endpoint and if it's a GET or POST. Assuming POST based on request body type.
    const apiEndpoint =
      'https://abhasbx.abdm.gov.in/abha/api/v1/account/phr-address/exists-by-phr-address';
    const requestBody: CheckABHAAddressExistsRequest = { phrAddress };
    return this.http.post<CheckABHAAddressExistsResponse>(apiEndpoint, requestBody, {
      headers: { 'X-Token': authToken }, // Verify if X-Token is needed
    });
  }
}
