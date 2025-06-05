import { M1Service } from '../src/services/m1.service';
import { HttpClient } from '../src/utils/http-client';
import { 
  LegacyABHACreationRequest as ABHACreationRequest, // Renamed for test compatibility, consider updating tests to use Legacy directly
  ABHACreationResponse,
  ABHAAddressResponse,
  MessageResponse,
  ABHAAddressRequest
} from '../src/types';

// Mock the HttpClient
jest.mock('../src/utils/http-client');

const mockHttpClient = new (HttpClient as jest.Mock)();
const m1Service = new M1Service(mockHttpClient);

describe('M1Service', () => {
  const authToken = 'test-token';
  const mockClientId = 'test-client-id';
  const mockClientSecret = 'test-client-secret';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================
  // Session Management
  // ======================


  describe('createGatewaySession', () => {
    it('should create a new session', async () => {
      const mockResponse = {
        accessToken: 'test-access-token',
        expiresIn: 3600,
        refreshToken: 'test-refresh-token',
        refreshExpiresIn: 2592000
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.createGatewaySession(mockClientId, mockClientSecret);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/sessions', {
        clientId: mockClientId,
        clientSecret: mockClientSecret,
        grantType: 'client_credentials',
      });
    });
  });

  // ======================
  // Aadhaar OTP Flow
  // ======================


  describe('sendAadhaarOTP', () => {
    it('should send OTP to Aadhaar linked mobile', async () => {
      const aadhaar = '123456789012';
      const purpose = 'AADHAAR_VERIFICATION';
      const mockResponse = { txnId: 'txn-123' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.sendAadhaarOTP(aadhaar);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/registration/m1/aadhaar/sendOtp',
        { aadhaar }
      );
    });
  });

  describe('verifyAadhaarOTPAndCreateABHA', () => {
    it('should verify Aadhaar OTP', async () => {
      const otp = '123456';
      const txnId = 'txn-123';
      const mockResponse = { token: 'test-token' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.verifyAadhaarOTPAndCreateABHA(otp, txnId);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/registration/m1/aadhaar/verifyOtp',
        { otp, txnId }
      );
    });
  });

  // ======================
  // ABHA Creation
  // ======================


  describe('createABHAWithAadhaar', () => {
    it('should create ABHA with Aadhaar', async () => {
      const requestData: ABHACreationRequest = {
        otp: '123456',
        txnId: 'txn-123',
        firstName: 'Test',
        lastName: 'User',
        gender: 'M',
        dob: '1990-01-01',
        mobile: '9876543210',
        email: 'test@example.com'
      };

      const mockResponse: ABHACreationResponse = {
        txnId: 'txn-123',
        token: 'test-token',
        expiresIn: 3600,
        refreshToken: 'test-refresh-token',
        profile: {
          abhaNumber: '12-3456-7890-1234',
          abhaAddress: 'test@abdm',
          firstName: 'Test',
          lastName: 'User',
          name: 'Test User', // Combined from firstName and lastName
          gender: 'M',
          dob: '1990-01-01',
          mobileNumber: '9876543210', // Renamed from mobile
          email: 'test@example.com'
        }
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 201,
      });

      const result = await m1Service.createABHAWithAadhaar(requestData);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/registration/m1/aadhaar/createAbha',
        requestData
      );
    });
  });

  // ======================
  // Mobile Update Flow
  // ======================


  describe('sendMobileUpdateOTP', () => {
    it('should send OTP for mobile update', async () => {
      const mobile = '9876543210';
      const mockResponse = { txnId: 'txn-123' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.sendMobileUpdateOTP(mobile, authToken);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/registration/m1/mobile/sendOtp',
        { mobile },
        { authToken }
      );
    });
  });

  describe('verifyMobileUpdateOTP', () => {
    it('should verify mobile update OTP', async () => {
      const otp = '123456';
      const txnId = 'txn-123';
      const mockResponse = { message: 'Mobile updated successfully' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.verifyMobileUpdateOTP(otp, txnId, authToken);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/registration/m1/mobile/verifyOtp',
        { otp, txnId },
        { authToken }
      );
    });
  });

  // ======================
  // Email Verification
  // ======================


  describe('sendEmailVerificationLink', () => {
    it('should send email verification link', async () => {
      const email = 'test@example.com';
      const mockResponse = { message: 'Verification link sent' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.sendEmailVerificationLink(email, authToken);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/registration/m1/email/sendVerificationLink',
        { email },
        { authToken }
      );
    });
  });

  // ======================
  // ABHA Address Management
  // ======================


  describe('getABHAAddressSuggestions', () => {
    it('should get ABHA address suggestions', async () => {
      const txnId = 'txn-123';
      const mockResponse: ABHAAddressResponse = {
        suggestions: [
          { abhaAddress: 'test1@abdm', preferred: false },
          { abhaAddress: 'test2@abdm', preferred: true },
        ],
      };

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.getABHAAddressSuggestions(txnId, authToken);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/registration/m1/abha/address/suggestions',
        {
          params: { txnId },
          authToken,
        }
      );
    });
  });

  describe('createABHAAddress', () => {
    it('should create or update ABHA address', async () => {
      const mockTxnId = 'txn-id-for-address';
      const abhaAddress = 'test@abdm';
      const preferred = true;
      const mockResponse = { message: 'ABHA address updated successfully' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m1Service.createABHAAddress(abhaAddress, mockTxnId, authToken, preferred);

      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/account/phr-address',
        { abhaAddress, preferred, txnId: mockTxnId },
        { headers: { 'X-Token': authToken } }
      );
    });
  });
});
