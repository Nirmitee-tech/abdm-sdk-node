import { HttpClient } from '../utils/http-client';
import type { APIResponse } from '../types/common';
import type {
  SessionRequest,
  SessionResponse,
  GenerateOtpRequest,
  GenerateOtpResponse,
  CreateAbhaRequest,
  CreateAbhaResponse,
} from '../types/m1';

export class M1Service {
  constructor(private readonly httpClient: HttpClient) {}

  public async getSession(sessionRequest: SessionRequest): Promise<APIResponse<SessionResponse>> {
    // This method seems to be pointing to a different gateway version (v3) than the one in http-client (v0.5).
    // For now, I'll leave it as is, but it might need to be corrected.
    return this.httpClient.post<SessionResponse>(
      `${this.httpClient.config.basePath}/v3/sessions`,
      sessionRequest
    );
  }

  public async sendAadhaarOTP(
    generateOtpRequest: GenerateOtpRequest
  ): Promise<APIResponse<GenerateOtpResponse>> {
    return this.httpClient.post<GenerateOtpResponse>(
      `${this.httpClient.config.baseUrl}/v3/enrollment/request/otp`,
      generateOtpRequest
    );
  }

  public async createAbhaIdByAadhaar(
    createAbhaRequest: CreateAbhaRequest
  ): Promise<APIResponse<CreateAbhaResponse>> {
    return this.httpClient.post<CreateAbhaResponse>(
      `${this.httpClient.config.baseUrl}/v3/enrollment/enrol/byAadhaar`,
      createAbhaRequest
    );
  }

  public async getPublicKey(): Promise<APIResponse<{ key: string }>> {
    return this.httpClient.get<{ key: string }>(
      `${this.httpClient.config.baseUrl}/v3/profile/public/certificate`
    );
  }
}
