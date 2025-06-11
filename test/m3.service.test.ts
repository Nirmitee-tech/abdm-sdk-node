import { M3Service } from '../src/services/m3.service';
import type { BridgeServiceRegistrationRequest, M3ConsentRequest, HealthInformationRequest } from '../src/types/m3';
import { HttpClient } from '../src/utils/http-client';

// Mock the HttpClient
jest.mock('../src/utils/http-client');

const mockHttpClient = new (HttpClient as jest.Mock)();
const m3Service = new M3Service(mockHttpClient);

describe('M3Service', () => {
  const authToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ======================
  // Session Management
  // ======================

  describe('createSession', () => {
    it('should create a new session', async () => {
      const clientId = 'test-client';
      const clientSecret = 'test-secret';
      const mockResponse = {
        accessToken: 'test-access-token',
        expiresIn: 3600,
        refreshToken: 'test-refresh-token',
        tokenType: 'Bearer',
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m3Service.createSession(clientId, clientSecret);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v3/sessions', {
        clientId,
        clientSecret,
        grantType: 'client_credentials',
      });
    });

    it('should throw an error when session creation fails', async () => {
      mockHttpClient.post.mockResolvedValueOnce({
        success: false,
        statusCode: 401,
        error: { message: 'Invalid credentials' },
      });

      await expect(m3Service.createSession('invalid', 'credentials')).rejects.toThrow('Failed to create session');
    });
  });

  // ======================
  // Bridge Service Management
  // ======================

  describe('updateBridgeUrl', () => {
    it('should update bridge URL', async () => {
      const bridgeId = 'bridge-123';
      const url = 'https://new-bridge-url.com';

      mockHttpClient.patch.mockResolvedValueOnce({
        success: true,
        data: { success: true },
        statusCode: 200,
      });

      const result = await m3Service.updateBridgeUrl(bridgeId, url, authToken);
      expect(result).toEqual({ success: true });
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        `/v3/bridges/${bridgeId}`,
        { url },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
    });
  });

  describe('registerBridgeService', () => {
    it('should register a new bridge service', async () => {
      const service: BridgeServiceRegistrationRequest = {
        id: 'service-123',
        name: 'Test Service',
        types: ['HIU'],
        endpoints: {
          hiuEndpoints: [
            {
              use: 'hiu-service',
              connectionType: 'REST',
              address: 'https://hiu-service.com',
            },
          ],
        },
        active: true,
      };

      const mockResponse = {
        ...service,
        createdAt: new Date().toISOString(),
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 201,
      });

      const result = await m3Service.registerBridgeService(service, authToken);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v3/services', service, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    });
  });

  // ======================
  // HIU Consent APIs
  // ======================

  describe('initConsentRequest', () => {
    it('should initialize a consent request', async () => {
      const consentRequest: M3ConsentRequest = {
        requestId: 'req-123',
        timestamp: new Date().toISOString(),
        consent: {
          purpose: {
            text: 'Treatment',
            code: 'TREATMENT',
          },
          patient: {
            id: 'patient-123',
          },
          hiTypes: ['OPConsultation'],
          permission: {
            accessMode: 'VIEW',
            dateRange: {
              from: '2023-01-01T00:00:00.000Z',
              to: '2023-12-31T23:59:59.999Z',
            },
            dataEraseAt: '2024-01-31T23:59:59.999Z',
            frequency: {
              unit: 'HOUR',
              value: '1',
              repeats: 1,
            },
          },
        },
      };

      const mockResponse = {
        requestId: 'req-123',
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 202,
      });

      const result = await m3Service.requestConsent(consentRequest, authToken);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v0.5/consent-requests', consentRequest, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    });
  });

  describe('getConsentRequestStatus', () => {
    it('should get consent request status', async () => {
      const requestId = 'req-123';
      const mockResponse = {
        requestId,
        timestamp: new Date().toISOString(),
        consentRequest: {
          id: 'consent-123',
          status: 'GRANTED',
          createdAt: new Date().toISOString(),
          consentArtefacts: [
            {
              id: 'artefact-123',
              status: 'GRANTED',
              signature: 'signature-123',
            },
          ],
        },
      };

      mockHttpClient.get.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 200,
      });

      const result = await m3Service.getConsentStatus(requestId, authToken);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.get).toHaveBeenCalledWith(`/v0.5/consent-requests/${requestId}/status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    });
  });

  // ======================
  // Health Information APIs
  // ======================

  describe('requestHealthInformation', () => {
    it('should request health information', async () => {
      const healthInfoRequest: HealthInformationRequest = {
        requestId: 'req-123',
        timestamp: new Date().toISOString(),
        hiRequest: {
          consentId: 'consent-123',
          dateRange: {
            from: '2023-01-01T00:00:00.000Z',
            to: '2023-12-31T23:59:59.999Z',
          },
          dataPushUrl: 'https://callback.example.com/health-data',
          keyMaterial: {
            cryptoAlg: 'ECDH',
            curve: 'Curve25519',
            dhPublicKey: {
              expiry: '2023-12-31T23:59:59.999Z',
              keyValue: 'public-key-value',
              parameters: 'Curve25519/32byte random key',
            },
            nonce: 'nonce-value',
          },
        },
      };

      const mockResponse = {
        requestId: 'req-123',
        timestamp: new Date().toISOString(),
        hiRequest: {
          sessionStatus: 'REQUESTED',
        },
      };

      mockHttpClient.post.mockResolvedValueOnce({
        success: true,
        data: mockResponse,
        statusCode: 202,
      });

      const result = await m3Service.requestHealthInformation(healthInfoRequest, authToken);
      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v0.5/health-information', healthInfoRequest, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
    });
  });
});
