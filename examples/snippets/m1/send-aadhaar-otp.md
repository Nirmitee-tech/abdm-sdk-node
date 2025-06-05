# Send Aadhaar OTP

Example showing how to send OTP for Aadhaar verification during ABHA enrollment.

```typescript
import { HttpClient } from '../../src/utils/http-client';
import { M1Service } from '../../src/services/m1.service';

// Initialize HTTP client
const httpClient = new HttpClient({
  baseURL: 'https://dev.abdm.gov.in',
  // Add your access token if required
  // headers: { 'Authorization': 'Bearer YOUR_ACCESS_TOKEN' }
});

const m1Service = new M1Service(httpClient);

// Replace with actual Aadhaar number (without spaces)
const aadhaarNumber = 'XXXXXXXXXXXX';

async function sendOTP() {
  try {
    const response = await m1Service.sendAadhaarOTP(aadhaarNumber);
    console.log('OTP sent successfully. Txn ID:', response.data.txnId);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
}

// Execute the function
sendOTP();
```

### Response

```json
{
  "txnId": "a825f76b-0696-40f3-864c-5a3a5b389a83",
  "message": "OTP sent successfully"
}
```

### Notes
- Replace `XXXXXXXXXXXX` with the actual Aadhaar number.
- The OTP will be sent to the registered mobile number.
- Store the `txnId` for OTP verification.
