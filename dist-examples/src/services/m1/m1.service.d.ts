import type { APIResponse, SessionResponse } from '../../types/common';
import type { SessionRequest, GenerateOtpRequest, GenerateOtpResponse, CreateAbhaRequest, CreateAbhaResponse } from '../../types/m1/m1';
import type { HttpClient } from '../../utils/http-client';
export declare class M1Service {
    private readonly httpClient;
    constructor(httpClient: HttpClient);
    getSession(_sessionRequest: SessionRequest): Promise<APIResponse<SessionResponse>>;
    generateOTP(generateOtpRequest: GenerateOtpRequest): Promise<APIResponse<GenerateOtpResponse>>;
    createAbhaIdByAadhaar(createAbhaRequest: CreateAbhaRequest): Promise<APIResponse<CreateAbhaResponse>>;
    getPublicKey(): Promise<APIResponse<{
        key: string;
    }>>;
}
//# sourceMappingURL=m1.service.d.ts.map