# Register Bridge Service

Example showing how to register a new bridge service (HIP/HIU) in the ABDM network.

```typescript
import { ABDMClient } from '@nirmitee/abdm-sdk-node';

// Initialize HTTP client
const httpClient = new HttpClient({
  baseURL: 'https://dev.abdm.gov.in',
});

const m3Service = new M3Service(httpClient);

// Replace with your access token
const authToken = 'YOUR_ACCESS_TOKEN';

// Bridge service registration data
const bridgeService = {
  serviceName: 'My Health Service',
  serviceType: 'HIP', // or 'HIU'
  serviceUrl: 'https://your-service-url.com/api',
  callbackUrl: 'https://your-service-url.com/callback',
  active: true,
  description: 'Health Information Provider Service'
};

async function registerService() {
  try {
    const response = await m3Service.registerBridgeService(bridgeService, authToken);
    console.log('Bridge service registered successfully:', response);
    return response;
  } catch (error) {
    console.error('Error registering bridge service:', error);
    throw error;
  }
}

// Execute the function
registerService();
```

### Response

```json
{
  "serviceId": "service-12345",
  "serviceName": "My Health Service",
  "serviceType": "HIP",
  "serviceUrl": "https://your-service-url.com/api",
  "callbackUrl": "https://your-service-url.com/callback",
  "active": true,
  "createdAt": "2025-06-05T13:15:30Z",
  "updatedAt": "2025-06-05T13:15:30Z"
}
```

### Notes
- Replace `YOUR_ACCESS_TOKEN` with a valid access token with appropriate permissions.
- The `serviceType` should be either 'HIP' (Health Information Provider) or 'HIU' (Health Information User).
- Ensure your service URLs are publicly accessible and properly configured to handle ABDM callbacks.
