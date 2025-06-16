import type { AxiosRequestConfig } from 'axios';
import type { ABDMConfig, APIResponse } from '../types';
export declare class HttpClient {
    private readonly client;
    readonly config: ABDMConfig;
    private _authToken;
    private _tokenExpiry;
    private _publicKey;
    private _privateKey;
    private _keyId;
    /**
     * Get the current authentication token
     */
    get authToken(): string | null;
    /**
     * Set the authentication token
     */
    set authToken(token: string | null);
    /**
     * Get the token expiry time
     */
    get tokenExpiry(): Date | null;
    /**
     * Set the token expiry time
     */
    set tokenExpiry(expiry: Date | null);
    /**
     * Get the current authentication token (legacy method)
     */
    getAuthToken(): string | null;
    /**
     * Set the authentication token (legacy method)
     */
    setAuthToken(token: string | null): void;
    /**
     * Get the public key
     */
    get publicKey(): string | null;
    /**
     * Set the public key
     */
    set publicKey(publicKey: string);
    /**
     * Get the private key
     */
    get privateKey(): string | null;
    /**
     * Set the private key
     */
    set privateKey(privateKey: string);
    /**
     * Get the key ID
     */
    get keyId(): string | null;
    /**
     * Set the key ID
     */
    set keyId(keyId: string);
    constructor(config: ABDMConfig);
    /**
     * Authenticates with ABDM and returns the access token.
     * @param retryCount Number of times to retry on 202 Accepted (default: 3)
     * @param retryDelay Delay between retries in milliseconds (default: 1000)
     */
    authenticate(retryCount?: number, retryDelay?: number): Promise<string>;
    /**
     * Encrypts data using the ABDM public key.
     * @param data The string data to encrypt.
     * @returns The Base64-encoded encrypted string.
     */
    encrypt(data: string): string;
    /**
     * The core request method for all HTTP calls.
     * @param config The Axios request config.
     * @returns A standardized APIResponse object.
     */
    private request;
    /**
     * Normalize error response from Axios.
     * @param error The Axios error.
     * @returns A standardized error object.
     */
    private normalizeError;
    get<T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>>;
    patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>>;
}
//# sourceMappingURL=http-client.d.ts.map