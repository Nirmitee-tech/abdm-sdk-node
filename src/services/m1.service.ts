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

  public async getSession(sessionRequest: SessionRequest): Promise<APIResponse<SessionResponse>> {
    // This method seems to be pointing to a different gateway version (v3) than the one in http-client (v0.5).
    // For now, I'll leave it as is, but it might need to be corrected.
    const response = await this.httpClient.post<SessionResponse>(
      `${this.httpClient.config.baseURL}/v3/sessions`,
      sessionRequest
    );

    if (response.status >= 400 || !response.data) {
      throw new Error('Failed to create session');
    }

    return response;
  }

  public async sendAadhaarOTP(generateOtpRequest: GenerateOtpRequest): Promise<APIResponse<GenerateOtpResponse>> {
    const response = await this.httpClient.post<GenerateOtpResponse>(
      `${this.httpClient.config.baseURL}/v3/enrollment/request/otp`,
      generateOtpRequest
    );

    if (response.status >= 400 || !response.data) {
      throw new Error('Failed to send Aadhaar OTP');
    }

    return response;
  }

  public async createAbhaIdByAadhaar(createAbhaRequest: CreateAbhaRequest): Promise<APIResponse<CreateAbhaResponse>> {
    const response = await this.httpClient.post<CreateAbhaResponse>(
      `${this.httpClient.config.baseURL}/v3/enrollment/enrol/byAadhaar`,
      createAbhaRequest
    );

    if (response.status >= 400 || !response.data) {
      throw new Error('Failed to create ABHA ID');
    }

    return response;
  }

  public async getPublicKey(): Promise<APIResponse<{ key: string }>> {
    const response = await this.httpClient.get<{ key: string }>(
      `${this.httpClient.config.baseURL}/v3/profile/public/certificate`
    );

    if (response.status >= 400 || !response.data) {
      throw new Error('Failed to get public key');
    }

    return response;
  }
}
