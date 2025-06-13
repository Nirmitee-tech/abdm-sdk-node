export interface ABDMConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface ErrorResponse {
  error: string;
  error_description?: string;
}
