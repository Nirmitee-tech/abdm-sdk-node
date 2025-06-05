# Create Gateway Session

Example showing how to create a gateway session with the ABDM API.

```typescript
import { ABDMClient } from '@nirmitee/abdm-sdk-node';

// Initialize HTTP client with your base URL
const httpClient = new HttpClient({
  baseURL: 'https://dev.abdm.gov.in',
});

// Create M1 service instance
const m1Service = new M1Service(httpClient);

// Your client credentials from ABDM
const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';

// Create gateway session
async function createSession() {
  try {
    const response = await m1Service.createGatewaySession(clientId, clientSecret);
    console.log('Session created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

// Execute the function
createSession();
```

### Response

```json
{
  "accessToken": "your_access_token_here",
  "expiresIn": 3600,
  "refreshExpiresIn": 1800,
  "tokenType": "bearer"
}
```

### Notes
- Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual credentials.
- The access token is used for subsequent API calls.
- Implement token refresh logic as needed.
