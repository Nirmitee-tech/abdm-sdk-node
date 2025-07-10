"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
class AuthService {
    constructor(httpClient) {
        this.httpClient = httpClient;
        this.logger = console;
    }
    /**
     * Generates an OTP for Aadhaar-based authentication
     * @param request The request containing Aadhaar number and other details
     * @returns A promise that resolves to the OTP response
     * @throws {Error} If the request fails or the environment is not supported
     */
    async generateAadhaarOTP(request) {
        this.logger.debug('Generating Aadhaar OTP for Aadhaar number');
        try {
            const isSandbox = this.httpClient?.getConfig?.()?.useSandbox !== false;
            if (!isSandbox) {
                throw new Error('Only sandbox environment is currently supported');
            }
            // Validate Aadhaar number (basic validation for sandbox)
            const aadhaarNumber = request.aadhaarNumber?.trim() || '';
            if (!/^\d{12}$/.test(aadhaarNumber)) {
                throw new Error('Aadhaar number must be 12 digits');
            }
            // Use the correct OTP endpoint for the sandbox environment
            const otpUrl = 'abha/api/v3/enrollment/request/otp';
            // Get the auth token
            const authToken = this.httpClient?.getAuthToken?.();
            if (!authToken) {
                throw new Error('Not authenticated. Please authenticate first.');
            }
            try {
                // Prepare the request payload according to ABDM API specs
                const payload = {
                    txnId: '', // Empty as per documentation
                    scope: ['abha-enrol'],
                    loginHint: 'aadhaar',
                    loginId: aadhaarNumber,
                    otpSystem: 'aadhaar'
                };
                this.logger.debug('Aadhaar OTP request payload (sensitive data redacted):', {
                    ...payload,
                    loginId: '[ENCRYPTED]',
                    txnId: payload.txnId || 'auto-generated'
                });
                // Make the API call to request OTP
                this.logger.debug('Sending Aadhaar OTP request...');
                const response = await this.httpClient.post(otpUrl, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                }, 'default' // Use default base URL for sandbox
                );
                this.logger.debug('Aadhaar OTP response received:', response);
                return response;
            }
            catch (error) {
                // Log detailed error information
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    this.logger.error('Aadhaar OTP API Error Response:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data
                    });
                }
                else if (error.request) {
                    // The request was made but no response was received
                    this.logger.error('No response received from Aadhaar OTP API');
                }
                else {
                    // Something happened in setting up the request that triggered an Error
                    this.logger.error('Error in Aadhaar OTP process:', error.message);
                }
                // Re-throw with a more descriptive message
                if (error instanceof Error) {
                    throw new Error(`Failed to generate Aadhaar OTP: ${error.message}`);
                }
                throw new Error('Failed to generate Aadhaar OTP due to an unknown error');
            }
        }
        catch (error) {
            this.logger.error('Unexpected error in generateAadhaarOTP:', error);
            if (error instanceof Error) {
                throw new Error(`Failed to generate Aadhaar OTP: ${error.message}`);
            }
            throw new Error('Failed to generate Aadhaar OTP due to an unknown error');
        }
    }
    async createAbhaIdByAadhaar(createAbhaRequest) {
        const response = await this.httpClient.post('/v3/registration/aadhaar/createHealthId', createAbhaRequest, {}, 'auth' // Specify the service type as 'auth' to use the correct base URL
        );
        if (response.status === 'ERROR') {
            const errorData = response.data;
            throw new Error('Failed to create ABHA ID: ' + errorData.error?.message);
        }
        return response;
    }
}
exports.AuthService = AuthService;
// Re-export types
__exportStar(require("../types/auth"), exports);
//# sourceMappingURL=auth.service.js.map