import { HttpClient } from '../utils/http-client';
import { AadhaarOtpResponse, CreateAbhaRequest, CreateAbhaResponse, GenerateAadhaarOtpRequest, VerifyAadhaarOtpRequest, VerifyAadhaarOtpResponse } from '../types/auth';
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
      const otpUrl = 'abha/api/v3/enrollment/request/otp';
      
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
              'Content-Type': 'application/json',
              'Accept': 'application/json',
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
   * Verifies an OTP for Aadhaar-based authentication
   * @param request The request containing transaction ID and OTP value
   * @returns A promise that resolves to the OTP verification response
   * @throws {Error} If the request fails or the environment is not supported
   */
  public async verifyAadhaarOTP(request: VerifyAadhaarOtpRequest): Promise<APIResponse<VerifyAadhaarOtpResponse>> {
    this.logger.debug('Verifying Aadhaar OTP');

    try {
      const isSandbox = this.httpClient?.getConfig?.()?.useSandbox !== false;
      
      if (!isSandbox) {
        throw new Error('Only sandbox environment is currently supported');
      }

      // Validate required fields
      if (!request.txnId?.trim()) {
        throw new Error('Transaction ID is required');
      }

      if (!request.otpValue?.trim()) {
        throw new Error('OTP value is required');
      }

      // Use the correct endpoint for OTP verification
      const verifyOtpUrl = '/abha/api/v3/enrollment/enrol/byAadhaar';
      
      // Get the auth token
      const authToken = this.httpClient?.getAuthToken?.();
      
      if (!authToken) {
        throw new Error('Not authenticated. Please authenticate first.');
      }
      
      try {
        // Encrypt the OTP value using the httpClient's encrypt method
        this.logger.debug('Encrypting OTP value...');
        const encryptedOtp = await this.httpClient.encrypt(request.otpValue);
        
        // Prepare the request payload according to ABDM API specs
        const payload = {
          authData: {
            authMethods: ['otp'],
            otp: {
              txnId: request.txnId,
              otpValue: encryptedOtp,
              mobile: request.mobile || ''
            }
          },
          consent: {
            code: 'abha-enrollment',
            version: '1.4'
          }
        };
      
        this.logger.debug('Aadhaar OTP verification request payload (sensitive data redacted):', {
          ...payload,
          authData: {
            ...payload.authData,
            otp: {
              ...payload.authData.otp,
              otpValue: '[ENCRYPTED]'
            }
          }
        });
        
        // Make the API call to verify OTP
        this.logger.debug('Sending Aadhaar OTP verification request...');
        const response = await this.httpClient.post<VerifyAadhaarOtpResponse>(
          verifyOtpUrl, 
          payload, 
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          },
          'default' // Use default base URL for sandbox
        );
        
        this.logger.debug('Aadhaar OTP verification response received:', response);
        
        // Log the full response for debugging
        console.log('Full OTP verification response:', JSON.stringify(response, null, 2));

        return response;
      } catch (error: any) {
        // Log detailed error information
        if (error.response) {
          this.logger.error('Aadhaar OTP verification API Error Response:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        } else if (error.request) {
          this.logger.error('No response received from Aadhaar OTP verification API');
        } else {
          this.logger.error('Error in Aadhaar OTP verification process:', error.message);
        }
        if (error instanceof Error) {
          throw new Error(`Failed to verify Aadhaar OTP: ${error.message}`);
        }
        throw new Error('Failed to verify Aadhaar OTP due to an unknown error');
      }
    } catch (error) {
      this.logger.error('Unexpected error in verifyAadhaarOTP:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to verify Aadhaar OTP: ${error.message}`);
      }
      throw new Error('Failed to verify Aadhaar OTP due to an unknown error');
    }
  }
}

// Re-export types
export * from '../types/auth';
