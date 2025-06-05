# Get ABHA Profile

Example showing how to retrieve ABHA profile information using an access token.

```typescript
import { HttpClient } from '../../src/utils/http-client';
import { M2Service } from '../../src/services/m2.service';

// Initialize HTTP client
const httpClient = new HttpClient({
  baseURL: 'https://dev.abdm.gov.in',
});

const m2Service = new M2Service(httpClient);

// Replace with your access token
const accessToken = 'YOUR_ACCESS_TOKEN';

async function fetchABHAProfile() {
  try {
    const profile = await m2Service.getABHAProfile(accessToken);
    console.log('ABHA Profile:', profile);
    return profile;
  } catch (error) {
    console.error('Error fetching ABHA profile:', error);
    throw error;
  }
}

// Execute the function
fetchABHAProfile();
```

### Response

```json
{
  "healthIdNumber": "43-4221-5105-6749",
  "healthId": "user@abdm",
  "name": "John Doe",
  "firstName": "John",
  "middleName": "",
  "lastName": "Doe",
  "gender": "M",
  "yearOfBirth": "1990",
  "dayOfBirth": "15",
  "monthOfBirth": "06",
  "email": "user@example.com",
  "mobile": "9XXXXXXXX9",
  "profilePhoto": "",
  "authMethods": ["MOBILE_OTP", "AADHAAR_OTP"],
  "pincode": "110001",
  "stateCode": "7",
  "districtCode": "077",
  "stateName": "Delhi",
  "districtName": "Central Delhi"
}
```

### Notes
- Replace `YOUR_ACCESS_TOKEN` with a valid access token.
- The token should have the required scopes to access the profile.
- Handle token expiration and refresh as needed.
