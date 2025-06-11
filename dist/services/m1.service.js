"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M1Service = void 0;
class M1Service {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async getSession(sessionRequest) {
        // This method seems to be pointing to a different gateway version (v3) than the one in http-client (v0.5).
        // For now, I'll leave it as is, but it might need to be corrected.
        const response = await this.httpClient.post(`${this.httpClient.config.baseURL}/v3/sessions`, sessionRequest);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to create session');
        }
        return response;
    }
    async sendAadhaarOTP(generateOtpRequest) {
        const response = await this.httpClient.post(`${this.httpClient.config.baseURL}/v3/enrollment/request/otp`, generateOtpRequest);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to send Aadhaar OTP');
        }
        return response;
    }
    async createAbhaIdByAadhaar(createAbhaRequest) {
        const response = await this.httpClient.post(`${this.httpClient.config.baseURL}/v3/enrollment/enrol/byAadhaar`, createAbhaRequest);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to create ABHA ID');
        }
        return response;
    }
    async getPublicKey() {
        const response = await this.httpClient.get(`${this.httpClient.config.baseURL}/v3/profile/public/certificate`);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to get public key');
        }
        return response;
    }
}
exports.M1Service = M1Service;
//# sourceMappingURL=m1.service.js.map