"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M1Service = void 0;
class M1Service {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async getSession(_sessionRequest) {
        const response = await this.httpClient.post('/v3/auth/session', _sessionRequest);
        return {
            status: response.status,
            data: response.data,
        };
    }
    async generateOTP(generateOtpRequest) {
        const response = await this.httpClient.post('/v3/auth/otp', generateOtpRequest);
        if (response.status === 'ERROR') {
            const errorData = response.data;
            throw new Error('Failed to verify OTP: ' + errorData.error?.message);
        }
        return {
            status: response.status,
            data: response.data
        };
    }
    async createAbhaIdByAadhaar(createAbhaRequest) {
        const response = await this.httpClient.post('/v3/registration/aadhaar/createHealthId', createAbhaRequest);
        if (response.status === 'ERROR') {
            const errorData = response.data;
            throw new Error('Failed to create ABHA ID: ' + errorData.error?.message);
        }
        return response;
    }
    async getPublicKey() {
        const response = await this.httpClient.get('/v3/certificate/public');
        if (response.status === 'ERROR') {
            const errorData = response.data;
            throw new Error('Failed to get public key: ' + errorData.error?.message);
        }
        else if (!response.data) {
            throw new Error('Failed to get public key');
        }
        return response;
    }
}
exports.M1Service = M1Service;
//# sourceMappingURL=m1.service.js.map