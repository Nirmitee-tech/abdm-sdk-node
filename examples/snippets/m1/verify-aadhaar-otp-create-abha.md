# Verify Aadhaar OTP and Create ABHA

Example showing how to verify Aadhaar OTP and create an ABHA account.

```typescript
import { ABDMClient } from '@nirmitee/abdm-sdk-node';

// Initialize HTTP client
const httpClient = new HttpClient({
  baseURL: 'https://dev.abdm.gov.in',
  // Add your access token if required
  // headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
});

const m1Service = new M1Service(httpClient);

// Replace with actual values
const otp = '123456'; // OTP received on mobile
const txnId = 'a825f76b-0696-40f3-864c-5a3a5b389a83'; // From sendAadhaarOTP response
const preferredAbhaAddress = 'user@abdm'; // Optional

async function verifyOTPAndCreateABHA() {
  try {
    const response = await m1Service.verifyAadhaarOTPAndCreateABHA(
      otp,
      txnId,
      preferredAbhaAddress
    );
    console.log('ABHA created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating ABHA:', error);
    throw error;
  }
}

// Execute the function
verifyOTPAndCreateABHA();
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
  "yearOfBirth": "1990",
  "dayOfBirth": "15",
  "monthOfBirth": "06",
  "gender": "M",
  "email": "user@example.com",
  "profilePhoto": "",
  "mobile": "9XXXXXXXX9",
  "authMethods": ["MOBILE_OTP", "AADHAAR_OTP"],
  "pincode": "110001",
  "stateCode": "7",
  "districtCode": "077",
  "stateName": "Delhi",
  "districtName": "Central Delhi"
}
```

### Notes
- Replace the OTP, txnId, and preferredAbhaAddress with actual values.
- The preferredAbhaAddress is optional but recommended for better user experience.
- Store the healthId and healthIdNumber securely.
