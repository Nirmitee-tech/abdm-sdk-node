import { HttpClient } from '../utils/http-client';
import { AadhaarOtpResponse, CreateAbhaRequest, CreateAbhaResponse, GenerateAadhaarOtpRequest } from '../types/auth';
import { APIResponse } from '../types/common';

interface Logger {
  debug: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  createChild?: (name: string) => Logger;
}

export class AuthService {
  private logger: Logger;

  constructor(private readonly httpClient: HttpClient) {
    this.logger = console;
  }



  /**
   * Generates an OTP for Aadhaar-based authentication
   * @param request The request containing Aadhaar number and other details
   * @returns A promise that resolves to the OTP response
   * @throws {Error} If the request fails or the environment is not supported
   */
  public async generateAadhaarOTP(request: GenerateAadhaarOtpRequest): Promise<APIResponse<AadhaarOtpResponse>> {
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
      const otpUrl = '/api/v3/enrollment/request/otp';
      
      // Get the auth token
      const authToken = this.httpClient?.getAuthToken?.();
      
      if (!authToken) {
        throw new Error('Not authenticated. Please authenticate first.');
      }
      
      try {
        // Encrypt the Aadhaar number using the httpClient's encrypt method
        this.logger.debug('Encrypting Aadhaar number...');
        const encryptedAadhaar = await this.httpClient.encrypt(aadhaarNumber);
        
        // Prepare the request payload according to ABDM API specs
        const payload = {
          txnId: '', // Empty as per documentation
          scope: ['abha-enrol'],
          loginHint: 'aadhaar',
          loginId: encryptedAadhaar,
          otpSystem: 'aadhaar'
        };
      
        this.logger.debug('Aadhaar OTP request payload (sensitive data redacted):', {
          ...payload,
          loginId: '[ENCRYPTED]',
          txnId: payload.txnId || 'auto-generated'
        });
        
        // Make the API call to request OTP
        this.logger.debug('Sending Aadhaar OTP request...');
        const response = await this.httpClient.post<AadhaarOtpResponse>(
          otpUrl, 
          payload, 
          {
            headers: {
              'X-Token': authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-CM-ID': 'sbx'
            },
          },
          'default' // Use default base URL for sandbox
        );
        
        this.logger.debug('Aadhaar OTP response received:', response);

        return response;
      } catch (error: any) {
        // Log detailed error information
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          this.logger.error('Aadhaar OTP API Error Response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          // The request was made but no response was received
          this.logger.error('No response received from Aadhaar OTP API');
        } else {
          // Something happened in setting up the request that triggered an Error
          this.logger.error('Error in Aadhaar OTP process:', error.message);
        }
        
        // Re-throw with a more descriptive message
        if (error instanceof Error) {
          throw new Error(`Failed to generate Aadhaar OTP: ${error.message}`);
        }
        
        throw new Error('Failed to generate Aadhaar OTP due to an unknown error');
      }
    } catch (error) {
      this.logger.error('Unexpected error in generateAadhaarOTP:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate Aadhaar OTP: ${error.message}`);
      }
      throw new Error('Failed to generate Aadhaar OTP due to an unknown error');
    }
  }

  public async createAbhaIdByAadhaar(createAbhaRequest: CreateAbhaRequest): Promise<APIResponse<CreateAbhaResponse>> {
    const response = await this.httpClient.post<CreateAbhaResponse>(
      '/v3/registration/aadhaar/createHealthId',
      createAbhaRequest,
      {},
      'auth' // Specify the service type as 'auth' to use the correct base URL
    );

    if (response.status === 'ERROR') {
      const errorData = response.data as { error?: { message?: string } };
      throw new Error('Failed to create ABHA ID: ' + errorData.error?.message);
    }

    return response;
  }

  /**
   * Fetches the public key from the ABDM server
   * @returns A promise that resolves to the public key response
   * @throws {Error} If the request fails or the response is invalid
   */
  public async getPublicKey(): Promise<APIResponse<{ key: string }>> {
    try {
      const isSandbox = this.httpClient?.getConfig?.()?.useSandbox !== false;
      
      if (isSandbox) {
        // For sandbox, we need to use a different endpoint
        const response = await this.httpClient.get<{ key: string }>(
          '/api/v1/auth/cert',
          {},
          'default' // Use the default base URL for sandbox
        );
        
        if (response.status === 'SUCCESS' && response.data?.key) {
          return {
            status: 'SUCCESS',
            data: { key: response.data.key }
          };
        }
      } else {
        // For production, use the standard endpoint
        const response = await this.httpClient.get<{ key: string }>(
          '/v3/certs',
          {},
          'auth' // Use the auth base URL for production
        );
        
        if (response.status === 'SUCCESS' && response.data?.key) {
          return response;
        }
      }
      
      throw new Error('Failed to fetch public key: Invalid response from server');
    } catch (error) {
      this.logger.error('Error fetching public key:', error);
      throw new Error(`Failed to fetch public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Re-export types
export * from '../types/auth';
