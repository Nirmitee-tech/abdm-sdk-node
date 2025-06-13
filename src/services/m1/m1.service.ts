import type { APIResponse, SessionResponse } from '../../types/common';
import type {
  SessionRequest,
  GenerateOtpRequest,
  GenerateOtpResponse,
  CreateAbhaRequest,
  CreateAbhaResponse,
} from '../../types/m1/m1';
import type { HttpClient } from '../../utils/http-client';

export class M1Service {
  constructor(private readonly httpClient: HttpClient) {}

  public async getSession(_sessionRequest: SessionRequest): Promise<APIResponse<SessionResponse>> {
    const response = await this.httpClient.post('/v3/auth/session', _sessionRequest);
    return {
      status: response.status as 'SUCCESS' | 'ERROR',
      data: response.data as SessionResponse,
    };
  }

  public async generateOTP(generateOtpRequest: GenerateOtpRequest): Promise<APIResponse<GenerateOtpResponse>> {
    const response = await this.httpClient.post('/v3/auth/otp', generateOtpRequest);

    if (response.status === 'ERROR') {
      const errorData = response.data as { error?: { message?: string } };
      throw new Error('Failed to verify OTP: ' + errorData.error?.message);
    }

    return {
      status: response.status as 'SUCCESS' | 'ERROR',
      data: response.data as GenerateOtpResponse
    };
  }

  public async createAbhaIdByAadhaar(createAbhaRequest: CreateAbhaRequest): Promise<APIResponse<CreateAbhaResponse>> {
    const response = await this.httpClient.post<CreateAbhaResponse>(
      '/v3/registration/aadhaar/createHealthId',
      createAbhaRequest
    );

    if (response.status === 'ERROR') {
      const errorData = response.data as { error?: { message?: string } };
      throw new Error('Failed to create ABHA ID: ' + errorData.error?.message);
    }

    return response;
  }

  public async getPublicKey(): Promise<APIResponse<{ key: string }>> {
    const response = await this.httpClient.get<{ key: string }>(
      '/v3/certificate/public'
    );

    if (response.status === 'ERROR') {
      const errorData = response.data as { error?: { message?: string } };
      throw new Error('Failed to get public key: ' + errorData.error?.message);
    } else if (!response.data) {
      throw new Error('Failed to get public key');
    }

    return response;
  }
}
