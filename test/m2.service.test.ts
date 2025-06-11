import { M2Service } from '../src/services/m2.service';
import type { HealthFacilityRequest, GenerateTokenRequest, ConsentRequest, FetchRecordsOptions } from '../src/types';
import { HttpClient } from '../src/utils/http-client';

// Mock the HttpClient
jest.mock('../src/utils/http-client');

const mockHttpClient = new (HttpClient as jest.Mock)();
const m2Service = new M2Service(mockHttpClient);

describe('M2Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addUpdateHealthFacilityServices', () => {
    it('should add/update health facility services', async () => {
      const mockRequest: HealthFacilityRequest = {
        facilityId: 'facility-123',
        facilityName: 'Test Health Facility',
        HRP: [
          {
            bridgeId: 'bridge-123',
            hipName: 'Test HIP',
            type: 'HIP',
            active: true,
          },
        ],
      };

      const mockResponse = {
        facilityId: 'facility-123',
        facilityName: 'Test Health Facility',
        HRP: [
          {
            bridgeId: 'bridge-123',
            hipName: 'Test HIP',
            type: 'HIP',
            active: true,
          },
        ],
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.addUpdateHealthFacilityServices(mockRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/bridges/MutipleHRPAddUpdateServices', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when API call fails', async () => {
      const mockRequest: HealthFacilityRequest = {
        facilityId: 'facility-123',
        facilityName: 'Test Health Facility',
        HRP: [],
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: false,
        error: {
          code: 500,
          message: 'Internal Server Error',
        },
        statusCode: 500,
      });

      await expect(m2Service.addUpdateHealthFacilityServices(mockRequest)).rejects.toThrow(
        'Failed to update health facility services'
      );
    });
  });

  describe('generateToken', () => {
    it('should generate a token', async () => {
      const mockRequest: GenerateTokenRequest = {
        abhaAddress: 'user@abdm',
        linkToken: 'test-link-token',
        // 'response' field removed as it's not part of GenerateTokenRequest
      };

      const mockResponse = {
        token: 'test-token',
        expiresIn: 3600,
        refreshToken: 'test-refresh-token',
        refreshExpiresIn: 86400,
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.generateToken(mockRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/hip/token/generate-token', mockRequest);
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when token generation fails', async () => {
      const mockRequest: GenerateTokenRequest = {
        abhaAddress: 'user@abdm',
        linkToken: 'test-link-token',
        // 'response' field removed as it's not part of GenerateTokenRequest
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: false,
        error: {
          code: 401,
          message: 'Unauthorized',
        },
        statusCode: 401,
      });

      await expect(m2Service.generateToken(mockRequest)).rejects.toThrow('Failed to generate token');
    });
  });

  describe('getABHAProfile', () => {
    it('should get ABHA profile', async () => {
      const mockToken = 'test-token';
      const mockProfile = {
        abhaNumber: '12-3456-7890-1234',
        preferredAbhaAddress: 'user@abdm',
        mobile: '9876543210',
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        yearOfBirth: '1990',
        dayOfBirth: '01',
        monthOfBirth: '01',
        gender: 'M',
        address: '123 Test St',
        district: 'Test District',
        state: 'Test State',
        pincode: '123456',
        email: 'john.doe@example.com',
        profilePhoto: 'base64encodedphoto',
        kycStatus: 'VERIFIED',
        kycVerifiedDate: '2023-01-01T00:00:00Z',
        createdDate: '2023-01-01T00:00:00Z',
      };

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockProfile,
        statusCode: 200,
      });

      const result = await m2Service.getABHAProfile(mockToken);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/profile/me', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      });
      expect(result).toEqual(mockProfile);
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });

    it('should throw an error when profile fetch fails', async () => {
      const mockToken = 'invalid-token';

      mockHttpClient.get.mockResolvedValueOnce({
        success: false,
        error: {
          code: 401,
          message: 'Unauthorized',
        },
        statusCode: 401,
      });

      await expect(m2Service.getABHAProfile(mockToken)).rejects.toThrow('Failed to get ABHA profile');
    });
  });

  describe('verifyABHAAddress', () => {
    it('should verify ABHA address', async () => {
      const mockAbhaAddress = 'user@abdm';
      const mockResponse = { exists: true };

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.verifyABHAAddress(mockAbhaAddress);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/abha/address/verify?abhaAddress=user%40abdm');
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when verification fails', async () => {
      const mockAbhaAddress = 'invalid@abdm';

      mockHttpClient.get.mockResolvedValueOnce({
        success: false,
        error: {
          code: 400,
          message: 'Invalid ABHA address',
        },
        statusCode: 400,
      });

      await expect(m2Service.verifyABHAAddress(mockAbhaAddress)).rejects.toThrow('Failed to verify ABHA address');
    });
  });

  describe('linkABHAAddress', () => {
    it('should link ABHA address', async () => {
      const mockAbhaNumber = '12-3456-7890-1234';
      const mockAbhaAddress = 'user@abdm';
      const mockToken = 'test-token';
      const mockResponse = { txnId: 'txn-123' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.linkABHAAddress(mockAbhaNumber, mockAbhaAddress, mockToken);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/abha/address/link',
        { abhaNumber: mockAbhaNumber, abhaAddress: mockAbhaAddress },
        {
          headers: {
            Authorization: 'Bearer test-token',
          },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error when linking fails', async () => {
      const mockAbhaNumber = '12-3456-7890-1234';
      const mockAbhaAddress = 'user@abdm';
      const mockToken = 'invalid-token';

      mockHttpClient.post.mockResolvedValueOnce({
        success: false,
        error: {
          code: 400,
          message: 'Invalid token',
        },
        statusCode: 400,
      });

      await expect(m2Service.linkABHAAddress(mockAbhaNumber, mockAbhaAddress, mockToken)).rejects.toThrow(
        'Failed to link ABHA address'
      );
    });
  });

  // ======================
  // Health Facility Management Tests
  // ======================

  describe('getHealthFacility', () => {
    it('should get health facility details', async () => {
      const facilityId = 'facility-123';
      const mockResponse = {
        facilityId,
        facilityName: 'Test Facility',
        HRP: [],
      };

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.getHealthFacility(facilityId);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/v1/facilities/${facilityId}`);
    });

    it('should throw error when failed to get facility', async () => {
      mockHttpClient.get.mockResolvedValueOnce({
        success: false,
        error: { message: 'Not found' },
        statusCode: 404,
      });

      await expect(m2Service.getHealthFacility('invalid-id')).rejects.toThrow('Failed to get health facility');
    });
  });

  describe('listHealthFacilities', () => {
    it('should list all health facilities', async () => {
      const mockFacilities = [
        { facilityId: 'facility-1', facilityName: 'Facility 1' },
        { facilityId: 'facility-2', facilityName: 'Facility 2' },
      ];

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockFacilities,
        statusCode: 200,
      });

      const result = await m2Service.listHealthFacilities();
      expect(result).toEqual(mockFacilities);
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/facilities');
    });
  });

  describe('updateHealthFacilityStatus', () => {
    it('should update health facility status', async () => {
      const facilityId = 'facility-123';
      const active = false;

      mockHttpClient.put.mockResolvedValueOnce({
        success: true,
        data: { success: true },
        statusCode: 200,
      });

      const result = await m2Service.updateHealthFacilityStatus(facilityId, active);
      expect(result).toEqual({ success: true });
      expect(mockHttpClient.put).toHaveBeenCalledWith(`/v1/facilities/${facilityId}/status`, { active });
    });
  });

  // ======================
  // ABHA Profile Management Tests
  // ======================

  describe('updateABHAProfile', () => {
    it('should update ABHA profile', async () => {
      const token = 'test-token';
      const profileData = { firstName: 'Updated', lastName: 'User' };
      const mockResponse = { ...profileData, updatedAt: new Date().toISOString() };

      mockHttpClient.put.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.updateABHAProfile(profileData, token);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.put).toHaveBeenCalledWith('/v1/profile/me', profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    });
  });

  describe('searchABHAProfiles', () => {
    it('should search ABHA profiles', async () => {
      const query = 'test';
      const token = 'test-token';
      const mockProfiles = [
        { abhaNumber: '123', name: 'Test User' },
        { abhaNumber: '456', name: 'Another Test' },
      ];

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockProfiles,
        statusCode: 200,
      });

      const result = await m2Service.searchABHAProfiles(query, token);
      expect(result).toEqual(mockProfiles);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/v1/profile/search?query=${encodeURIComponent(query)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    });
  });

  // ======================
  // ABHA Address Management Tests
  // ======================

  describe('unlinkABHAAddress', () => {
    it('should unlink ABHA address', async () => {
      const address = 'test@abdm';
      const token = 'test-token';

      mockHttpClient.post.mockResolvedValueOnce({
        data: { success: true },
        statusCode: 200,
      });

      const result = await m2Service.unlinkABHAAddress(address, token);
      expect(result).toEqual({ success: true });
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/abha/address/unlink',
        { abhaAddress: address },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    });
  });

  // ======================
  // Token Management Tests
  // ======================

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      const refreshToken = 'refresh-token';
      const mockResponse = {
        token: 'new-access-token',
        expiresIn: 3600,
        refreshToken: 'new-refresh-token',
        refreshExpiresIn: 2592000,
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.refreshToken(refreshToken);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/token/refresh', { refreshToken });
    });
  });

  // ======================
  // Consent Management Tests
  // ======================

  describe('createConsent', () => {
    it('should create a new consent', async () => {
      const token = 'test-token';
      const consentData: ConsentRequest = {
        patientId: 'patient-123',
        purpose: 'TREATMENT',
        hiTypes: ['OPConsultation'],
        permission: {
          accessMode: 'VIEW',
          dateRange: {
            from: '2025-01-01',
            to: '2025-12-31',
          },
          dataEraseAt: '2026-01-01',
          frequency: {
            unit: 'HOUR',
            value: 1,
            repeats: 24,
          },
        },
        requester: {
          name: 'Dr. Smith',
          identifier: {
            type: 'DOCTOR',
            value: 'DOC123',
          },
        },
        hiu: {
          id: 'hiu-123',
          name: 'Health Info User',
        },
      };

      const mockResponse = {
        consentId: 'consent-123',
        status: 'REQUESTED',
        consentDetail: consentData,
        signature: 'signature-123',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      mockHttpClient.post.mockResolvedValueOnce({
        data: mockResponse,
        statusCode: 201,
      });

      const result = await m2Service.createConsent(consentData, token);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v0.5/consent-requests', consentData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    });
  });

  // ======================
  // Health Records Tests
  // ======================

  describe('fetchHealthRecords', () => {
    it('should fetch health records with options', async () => {
      const patientId = 'patient-123';
      const token = 'test-token';
      const options: FetchRecordsOptions = {
        fromDate: '2025-01-01',
        toDate: '2025-06-01',
        hiTypes: ['OPConsultation', 'DiagnosticReport'],
        limit: 10,
        offset: 0,
      };

      const mockResponse = {
        records: [
          { id: 'record-1', title: 'OPD Visit', hiType: 'OPConsultation' },
          { id: 'record-2', title: 'Lab Report', hiType: 'DiagnosticReport' },
        ],
        total: 2,
        limit: 10,
        offset: 0,
      };

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.fetchHealthRecords(patientId, token, options);
      expect(result).toEqual(mockResponse);

      // Verify the URL contains the expected base and parameters
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/v1/health-records'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Verify the URL contains all expected parameters
      const calledUrl = mockHttpClient.get.mock.calls[0][0];
      const url = new URL(`http://test${calledUrl}`);
      expect(url.searchParams.get('patientId')).toBe(patientId);
      expect(url.searchParams.get('fromDate')).toBe('2025-01-01');
      expect(url.searchParams.get('toDate')).toBe('2025-06-01');
      expect(url.searchParams.get('hiTypes')).toBe('OPConsultation,DiagnosticReport');
      expect(url.searchParams.get('limit')).toBe('10');
    });
  });

  // ======================
  // Authentication Tests
  // ======================

  describe('initiateAuth', () => {
    it('should initiate authentication', async () => {
      const abhaAddress = 'user@abdm';
      const mockResponse = { txnId: 'txn-123' };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m2Service.initiateAuth(abhaAddress);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/auth/initiate', { abhaAddress });
    });
  });
});
