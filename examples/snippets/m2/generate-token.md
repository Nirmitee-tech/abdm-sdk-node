# Generate ABHA Profile Access Token

Example showing how to generate a token for accessing ABHA profile information.

```typescript
import { HttpClient } from '../../src/utils/http-client';
import { M2Service } from '../../src/services/m2.service';

// Initialize HTTP client
const httpClient = new HttpClient({
  baseURL: 'https://dev.abdm.gov.in',
  // Add your access token if required
  // headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
});

const m2Service = new M2Service(httpClient);

// Token generation request data
const tokenRequest = {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  grantType: 'client_credentials',
  scope: 'abha/profile/view'
};

async function generateAccessToken() {
  try {
    const response = await m2Service.generateToken(tokenRequest);
    console.log('Access token generated successfully:', response.accessToken);
    return response;
  } catch (error) {
    console.error('Error generating access token:', error);
    throw error;
  }
}

// Execute the function
generateAccessToken();
```

### Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

### Notes
- Replace `your-client-id` and `your-client-secret` with your actual credentials.
- The access token is valid for a limited time (usually 1 hour).
- Store the token securely and implement token refresh logic.
