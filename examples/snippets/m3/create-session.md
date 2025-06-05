# Create M3 Session

Example showing how to create a session for M3 (Milestone 3) API operations.

```typescript
import { ABDMClient } from '@nirmitee/abdm-sdk-node';

// Initialize HTTP client
const httpClient = new HttpClient({
  baseURL: 'https://dev.abdm.gov.in',
});

const m3Service = new M3Service(httpClient);

// Your client credentials
const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';

async function createM3Session() {
  try {
    const session = await m3Service.createSession(clientId, clientSecret);
    console.log('M3 Session created successfully:', session);
    return session;
  } catch (error) {
    console.error('Error creating M3 session:', error);
    throw error;
  }
}

// Execute the function
createM3Session();
```

### Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "refreshExpiresIn": 1800,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "bearer"
}
```

### Notes
- Replace `YOUR_CLIENT_ID` and `YOUR_CLIENT_SECRET` with your actual credentials.
- The access token is used for subsequent API calls.
- Implement token refresh logic using the refresh token before it expires.
