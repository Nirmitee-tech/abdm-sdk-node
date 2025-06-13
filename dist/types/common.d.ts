export interface APIResponse<T = any> {
    status: 'SUCCESS' | 'ERROR';
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}
export interface ABDMConfig {
    baseUrl: string;
    authBaseURL?: string;
    clientId: string;
    clientSecret: string;
    timeout?: number;
    headers?: Record<string, string>;
    useSandbox?: boolean;
}
//# sourceMappingURL=common.d.ts.map