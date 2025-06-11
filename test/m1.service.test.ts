import { M1Service } from '../src/services/m1.service';
import type {
  GenerateOtpRequest,
  GenerateOtpResponse,
  CreateAbhaRequest,
  CreateAbhaResponse,
  SessionRequest,
  SessionResponse,
  ABHAProfileData
} from '../src/types/m1';
import { HttpClient } from '../src/utils/http-client';

// Mock the HttpClient
jest.mock('../src/utils/http-client');

const mockHttpClient = new (HttpClient as jest.Mock)();
const m1Service = new M1Service(mockHttpClient);

describe('M1Service', () => {
  const baseURL = 'https://dev.abdm.gov.in/gateway/v0.5';

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpClient.config = { baseURL };
  });

  describe('getSession', () => {
    it('should create a new session', async () => {
      const sessionRequest: SessionRequest = {
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        grantType: 'client_credentials',
      };

      const mockResponse: SessionResponse = {
        accessToken: 'test-access-token',
        expiresIn: 3600,
        refreshExpiresIn: 2592000,
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer',
        'not-before-policy': 0,
        session_state: 'test-session-state',
        scope: 'abha-enrol',
      };

      mockHttpClient.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
      });

      const result = await m1Service.getSession(sessionRequest);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${baseURL}/v3/sessions`,
        sessionRequest
      );
    });
  });

  describe('sendAadhaarOTP', () => {
    it('should send OTP to Aadhaar number', async () => {
      const otpRequest: GenerateOtpRequest = {
        loginId: 'encrypted-aadhaar',
        loginHint: 'aadhaar',
        scope: ['abha-enrol'],
        otpSystem: 'aadhaar',
        txnId: 'txn-123',
      };
      
      const mockResponse: GenerateOtpResponse = {
        txnId: 'txn-123',
      };

      mockHttpClient.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200
      });

      const result = await m1Service.sendAadhaarOTP(otpRequest);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${baseURL}/v3/enrollment/request/otp`,
        otpRequest
      );
    });
  });

  describe('createAbhaIdByAadhaar', () => {
    it('should create ABHA ID using Aadhaar', async () => {
      const createRequest: CreateAbhaRequest = {
        txnId: 'txn-123',
        authData: {
          authMethods: ['otp'],
          otp: {
            otpValue: 'encrypted-otp',
            txnId: 'txn-123',
          },
        },
        consent: {
          code: 'consent-code',
          version: '1.0',
        },
      };

      const mockProfile: ABHAProfileData = {
        phrAddress: 'testuser@abdm',
        name: 'Test User',
        gender: 'M',
        yearOfBirth: '1990',
        monthOfBirth: '01',
        dayOfBirth: '01',
        mobile: '9876543210',
        stateName: 'Delhi',
        districtName: 'New Delhi',
        stateCode: '07',
        districtCode: '141',
        email: 'test@example.com',
        pincode: '110001',
        profilePhoto: 'base64encodedimage',
        address: 'Test Address',
        subDistrictName: 'Test Sub-District',
        villageName: 'Test Village',
        townName: 'Test Town',
        wardName: 'Test Ward',
        authMethods: ['aadhaar_otp'],
      };

      const mockResponse: CreateAbhaResponse = {
        ...mockProfile,
        token: 'test-token',
        expiresIn: 3600,
        refreshToken: 'test-refresh-token',
      };

      mockHttpClient.post.mockResolvedValueOnce({
        data: mockResponse,
        status: 200
      });

      const result = await m1Service.createAbhaIdByAadhaar(createRequest);
      expect(result.data).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${baseURL}/v3/enrollment/enrol/byAadhaar`,
        createRequest
      );
    });
  });
});
