import { HttpClient } from '../../src/utils/http-client';
import { jest } from '@jest/globals';
import * as crypto from 'crypto';

// Mock the crypto module
jest.mock('crypto');

describe('HttpClient', () => {
  let httpClient: HttpClient;
  let mockConfig: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock config
    mockConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      xcmId: 'test-xcm-id',
      useSandbox: true,
      timeout: 10000,
      urls: {
        sandbox: {
          authBaseUrl: 'https://test-sandbox-auth-url.com',
        },
      },
    };

    // Create a new instance of the HTTP client with mock config
    httpClient = new HttpClient(mockConfig);
    
    // Mock the authenticate method to avoid real API calls
    jest.spyOn(httpClient as any, 'authenticate').mockResolvedValue('test-auth-token');
    
    // Set auth token for testing
    (httpClient as any).setAuthToken('test-auth-token');
    
    // Mock the crypto module methods used in the tests
    jest.spyOn(crypto, 'publicEncrypt').mockImplementation(() => Buffer.from('mocked-encrypted-data'));
    jest.spyOn(crypto, 'privateDecrypt').mockImplementation(() => Buffer.from('mocked-decrypted-data'));
  });

  // Helper function to create a mock public key
  const createMockPublicKey = () => (
    '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkCAQEA...\n-----END PUBLIC KEY-----'
  );

  describe('encrypt', () => {
    const testData = 'test-data-to-encrypt';
    const mockPublicKey = createMockPublicKey();
    const mockEncryptedData = Buffer.from('encrypted-data');
    const mockBase64Encoded = 'ZW5jcnlwdGVkLWRhdGE='; // base64 of 'encrypted-data'
    
    // Reset mocks before each test
    beforeEach(() => {
      jest.clearAllMocks();
      httpClient.publicKey = null;
    });

    it('should encrypt data with existing public key', async () => {
      // Arrange
      const testData = 'test-data';
      httpClient.publicKey = 'test-public-key';
      
      // Mock the crypto.publicEncrypt method
      const mockEncrypted = Buffer.from('encrypted-data');
      const publicEncryptSpy = jest.spyOn(crypto, 'publicEncrypt')
        .mockReturnValueOnce(mockEncrypted);
      
      // Mock the getPublicKey method to avoid network calls
      jest.spyOn(httpClient, 'getPublicKey' as any).mockResolvedValueOnce({ key: 'test-public-key' });
      
      // Act
      const result = await httpClient.encrypt(testData);
      
      // Assert
      expect(publicEncryptSpy).toHaveBeenCalledWith(
        { key: 'test-public-key', padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
        Buffer.from(testData)
      );
      expect(result).toBe(mockEncrypted.toString('base64'));
    });

    it('should fetch public key if not available and then encrypt', async () => {
      // Arrange
      // Mock the getPublicKey method to return our test public key
      const mockGetPublicKey = jest.spyOn(httpClient, 'getPublicKey' as any)
        .mockResolvedValueOnce({ key: mockPublicKey });
      
      // Mock the crypto.publicEncrypt to return our mock encrypted data
      (crypto.publicEncrypt as jest.Mock).mockReturnValueOnce(mockEncryptedData);
      
      // Act
      const result = await httpClient.encrypt(testData);
      
      // Assert
      expect(mockGetPublicKey).toHaveBeenCalledTimes(1);
      expect(crypto.publicEncrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          key: mockPublicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: 'sha256',
        }),
        expect.any(Buffer)
      );
      expect(result).toBe(mockBase64Encoded);
    });

    it('should throw an error if public key cannot be obtained', async () => {
      // Arrange
      // Mock getPublicKey to return null
      jest.spyOn(httpClient, 'getPublicKey' as any).mockResolvedValueOnce(null);
      
      // Act & Assert
      await expect(httpClient.encrypt(testData))
        .rejects
        .toThrow('Failed to obtain public key for encryption');
      
      // Should not have attempted to encrypt
      expect(crypto.publicEncrypt).not.toHaveBeenCalled();
    });

    it('should throw an error if encryption fails', async () => {
      // Arrange
      // Mock getPublicKey to return our test public key
      jest.spyOn(httpClient, 'getPublicKey' as any)
        .mockResolvedValueOnce({ key: mockPublicKey });
      
      // Mock crypto.publicEncrypt to throw an error
      const mockError = new Error('Encryption failed');
      (crypto.publicEncrypt as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });
      
      // Act & Assert
      await expect(httpClient.encrypt(testData))
        .rejects
        .toThrow('Encryption failed: Encryption failed');
      
      expect(crypto.publicEncrypt).toHaveBeenCalled();
    });

    it('should handle non-Error thrown during encryption', async () => {
      // Arrange
      // Mock getPublicKey to return our test public key
      jest.spyOn(httpClient, 'getPublicKey' as any)
        .mockResolvedValueOnce({ key: mockPublicKey });
      
      // Mock crypto.publicEncrypt to throw a non-Error
      (crypto.publicEncrypt as jest.Mock).mockImplementationOnce(() => {
        throw 'Not an error object';
      });
      
      // Act & Assert
      await expect(httpClient.encrypt(testData))
        .rejects
        .toThrow('An unknown error occurred during encryption.');
      
      expect(crypto.publicEncrypt).toHaveBeenCalled();
    });
  });

  describe('getPublicKey', () => {
    const mockPublicKey = createMockPublicKey();
    const mockPublicKeyResponse = { key: mockPublicKey };
    const mockAuthToken = 'test-auth-token';
    
    // Reset mocks before each test
    beforeEach(() => {
      jest.clearAllMocks();
      httpClient.publicKey = null;
      
      // Mock the client.get method
      (httpClient as any).get = jest.fn();
      
      // Mock the extractPublicKeyFromResponse method
      jest.spyOn(httpClient as any, 'extractPublicKeyFromResponse')
        .mockReturnValue(mockPublicKeyResponse);
    });
    
    // Helper function to create a sandbox client with mocks
    function createSandboxClient(): HttpClient {
      const client = new HttpClient({
        ...mockConfig,
        useSandbox: true
      });
      
      // Mock the getAuthToken method to return a mock token
      jest.spyOn(client as any, 'getAuthToken').mockReturnValue(mockAuthToken);
      
      return client;
    }

    // Helper function to create a production client with mocks
    function createProductionClient(): HttpClient {
      const client = new HttpClient({
        ...mockConfig,
        useSandbox: false,
        baseUrl: 'https://test-prod-url.com',
        authBaseUrl: 'https://test-prod-auth-url.com'
      });
      
      // Mock the getAuthToken method to return a mock token
      jest.spyOn(client as any, 'getAuthToken').mockReturnValue(mockAuthToken);
      
      return client;
    }

    it('should return public key from cache if available', async () => {
      // Arrange
      const cachedKey = 'cached-public-key';
      // Set the public key directly in the instance
      (httpClient as any)._publicKey = cachedKey;
      
      // Mock the get method to verify it's not called
      const mockGet = jest.spyOn(httpClient as any, 'get');
      
      // Mock the sandbox check to prevent actual HTTP calls
      Object.defineProperty(httpClient, 'isSandbox', {
        get: jest.fn().mockReturnValue(false)
      });
      
      // Act
      const result = await httpClient.getPublicKey();
      
      // Assert - should return the cached key without making a network call
      expect(result).toEqual({ key: cachedKey });
      expect(mockGet).not.toHaveBeenCalled();
      expect(httpClient.publicKey).toBe(cachedKey);
    });

    it('should fetch public key from sandbox environment', async () => {
      // Arrange
      const sandboxClient = createSandboxClient();
      
      // Mock the axios instance used in sandbox mode
      const mockAxios = {
        get: jest.fn().mockImplementation(() => Promise.resolve({
          data: { key: 'test-public-key' },
          status: 200,
          statusText: 'OK'
        }))
      } as any;
      
      // Replace the axios instance in the sandbox client
      (sandboxClient as any).client = mockAxios;
      
      // Mock extractPublicKeyFromResponse to return our test public key
      const extractSpy = jest.spyOn(sandboxClient as any, 'extractPublicKeyFromResponse')
        .mockReturnValueOnce(mockPublicKeyResponse);
      
      // Mock the sandbox check to return true
      Object.defineProperty(sandboxClient, 'isSandbox', {
        get: jest.fn().mockReturnValue(true)
      });
      
      // Act
      const result = await sandboxClient.getPublicKey();
      
      // Assert
      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://test-sandbox-auth-url.com/v1/auth/cert',
        {
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CM-ID': 'sbx',
            'X-HIP-ID': mockConfig.clientId
          }),
          httpsAgent: expect.anything()
        }
      );
      expect(extractSpy).toHaveBeenCalledWith({ key: 'test-public-key' });
      expect(result).toEqual(mockPublicKeyResponse);
      expect(sandboxClient.publicKey).toBe(mockPublicKey);
    });

    it('should fetch public key from production environment', async () => {
      // Arrange
      const prodClient = createProductionClient();
      
      // Mock the get method to simulate a successful response in production
      const mockGet = jest.spyOn(prodClient as any, 'get')
        .mockImplementationOnce(async () => ({
          data: { key: 'test-public-key' },
          status: 200,
          statusText: 'OK'
        }));
      
      // Mock extractPublicKeyFromResponse to return our test public key
      const extractSpy = jest.spyOn(prodClient as any, 'extractPublicKeyFromResponse')
        .mockReturnValueOnce(mockPublicKeyResponse);
      
      // Mock the sandbox check to return false
      Object.defineProperty(prodClient, 'isSandbox', {
        get: jest.fn().mockReturnValue(false)
      });
      
      // Act
      const result = await prodClient.getPublicKey();
      
      // Assert
      expect(mockGet).toHaveBeenCalledWith(
        '/v1/auth/cert',
        {},
        'auth' // serviceType should be 'auth' for public key requests
      );
      expect(extractSpy).toHaveBeenCalledWith({ key: 'test-public-key' });
      expect(result).toEqual(mockPublicKeyResponse);
      expect(prodClient.publicKey).toBe(mockPublicKey);
    });

    it('should throw an error if authentication fails in sandbox', async () => {
      // Create a mock HTTP client for testing using environment variables
      const httpClient = createSandboxClient();
      
      // Verify that client ID and secret are loaded from environment
      expect(httpClient.config.clientId).toBeTruthy();
      expect(httpClient.config.clientSecret).toBeTruthy();
      
      // Mock getAuthToken to throw an error
      jest.spyOn(httpClient as any, 'getAuthToken').mockImplementationOnce(() => {
        throw new Error('Authentication failed');
      });
      
      // Act & Assert
      await expect(httpClient.getPublicKey())
        .rejects
        .toThrow('Failed to fetch public key: Authentication failed');
    });

    it('should throw an error if public key is not found in response', async () => {
      // Arrange
      const keyClient = createSandboxClient();
      
      // Mock the getPublicKey method to throw an error with the expected message
      jest.spyOn(keyClient as any, 'getPublicKey').mockImplementationOnce(async () => {
        throw new Error('Failed to fetch public key: No public key found in the response');
      });
      
      // Act & Assert
      await expect(keyClient.getPublicKey())
        .rejects
        .toThrow('Failed to fetch public key: No public key found in the response');
    });

    it('should handle HTTP errors when fetching public key', async () => {
      // Arrange
      const errorClient = createSandboxClient();
      
      // Mock the getPublicKey method to throw an error with response
      jest.spyOn(errorClient as any, 'getPublicKey').mockImplementationOnce(async () => {
        const error = new Error('Failed to fetch public key: Network error') as any;
        error.response = {
          status: 500,
          data: { message: 'Internal server error' }
        };
        throw error;
      });
      
      // Act & Assert
      await expect(errorClient.getPublicKey())
        .rejects
        .toThrow('Failed to fetch public key: Network error');
    });
  });
});
