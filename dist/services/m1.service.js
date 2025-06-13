"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.M1Service = void 0;
class M1Service {
    constructor(httpClient) {
        this.httpClient = httpClient;
    }
    async getSession(_sessionRequest) {
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
    async sendAadhaarOTP(generateOtpRequest) {
        const response = await this.httpClient.post(`${this.httpClient.config.baseURL}/v3/registration/aadhaar/generateOtp`, generateOtpRequest);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to send Aadhaar OTP');
        }
        return response;
    }
    async createAbhaIdByAadhaar(createAbhaRequest) {
        const response = await this.httpClient.post(`${this.httpClient.config.baseURL}/v3/registration/aadhaar/createHealthId`, createAbhaRequest);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to create ABHA ID');
        }
        return response;
    }
    async getPublicKey() {
        const response = await this.httpClient.get(`${this.httpClient.config.baseURL}/v3/certificate/public`);
        if (response.status >= 400 || !response.data) {
            throw new Error('Failed to get public key');
        }
        return response;
    }
}
exports.M1Service = M1Service;
//# sourceMappingURL=m1.service.js.map