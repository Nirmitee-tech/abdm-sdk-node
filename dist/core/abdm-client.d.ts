import { M1Service } from '../services/m1';
import { M2Service } from '../services/m2';
import { M3Service } from '../services/m3';
import type { ABDMConfig } from './common';
/**
 * Main client for interacting with the Ayushman Bharat Digital Mission (ABDM) APIs
 */
export declare class ABDMClient {
    private http;
    m1: M1Service;
    m2: M2Service;
    m3: M3Service;
    /**
     * Create a new ABDM client
     * @param config - Configuration for the ABDM client
     */
    /**
     * Create a new ABDM client
     * @param config - Configuration for the ABDM client
     * @example
     * // Basic usage with required config
     * const client = new ABDMClient({
     *   clientId: 'your-client-id',
     *   clientSecret: 'your-client-secret',
     *   basePath: 'https://dev.abdm.gov.in/gateway', // optional
     *   useSandbox: true, // optional, defaults to true
     * });
     */
    constructor(config: ABDMConfig);
    /**
     * Set a new authentication token
     * @param token - The authentication token
     * @param expiresIn - Optional time in seconds until the token expires (default: 1 hour)
     */
    setAuthToken(token: string, expiresIn?: number): void;
    /**
     * Clear the current authentication token
     */
    clearAuthToken(): void;
    /**
     * Get the current authentication token
     * @returns The current authentication token or null if not authenticated
     */
    getAuthToken(): string | null;
    /**
     * Check if the current token is valid
     * @returns True if the token is valid, false otherwise
     */
    isTokenValid(): boolean;
    /**
     * Authenticate with ABDM and get an access token
     * @returns A promise that resolves when authentication is complete
     */
    authenticate(): Promise<void>;
}
//# sourceMappingURL=abdm-client.d.ts.map