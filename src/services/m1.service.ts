import type { APIResponse } from '../types/common';
import type {
  SessionRequest,
  SessionResponse,
  GenerateOtpRequest,
  GenerateOtpResponse,
  CreateAbhaRequest,
  CreateAbhaResponse,
} from '../types/m1';
import type { HttpClient } from '../utils/http-client';

export class M1Service {
  constructor(private readonly httpClient: HttpClient) {}

  public async getSession(_sessionRequest: SessionRequest): Promise<APIResponse<SessionResponse>> {
    // Note: In v3, authentication is handled by the HttpClient using client credentials
    // This method is kept for backward compatibility but uses the token from HttpClient
    const authToken = this.httpClient.getAuthToken();
    if (!authToken) {
      throw new Error('Authentication token not available. Please authenticate first.');
    }
    
    return {
      status: 200,
      data: {
        accessToken: authToken,
        tokenType: 'bearer',
        expiresIn: 300 // Default expiration time in seconds
      },
      headers: {},
      config: {},
      timestamp: new Date()
    };
  }

  public async sendAadhaarOTP(generateOtpRequest: GenerateOtpRequest): Promise<APIResponse<GenerateOtpResponse>> {
    const response = await this.httpClient.post<GenerateOtpResponse>(
      `${this.httpClient.config.baseURL}/v3/registration/aadhaar/generateOtp`,
      generateOtpRequest
    );

    if (response.status >= 400 || !response.data) {
      throw new Error('Failed to send Aadhaar OTP');
    }

    return response;
  }

  public async createAbhaIdByAadhaar(createAbhaRequest: CreateAbhaRequest): Promise<APIResponse<CreateAbhaResponse>> {
    const response = await this.httpClient.post<CreateAbhaResponse>(
      `${this.httpClient.config.baseURL}/v3/registration/aadhaar/createHealthId`,
      createAbhaRequest
    );

    if (response.status >= 400 || !response.data) {
      throw new Error('Failed to create ABHA ID');
    }

    return response;
  }

  public async getPublicKey(): Promise<APIResponse<{ key: string }>> {
    const response = await this.httpClient.get<{ key: string }>(
      `${this.httpClient.config.baseURL}/v3/certificate/public`
    );

    if (response.status >= 400 || !response.data) {
      throw new Error('Failed to get public key');
    }

    return response;
  }
}
