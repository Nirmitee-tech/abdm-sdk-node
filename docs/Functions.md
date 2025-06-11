# ABDM SDK Node.js - API Reference

This document provides a comprehensive reference for all functions available in the ABDM SDK Node.js, organized by module. Each section details the available methods, their parameters, and the corresponding ABDM APIs they interact with.

## Table of Contents

- [M1Service](#m1service-abha-creation--management)
- [M2Service](#m2service-health-facility--abha-profile)
- [M3Service](#m3service-hiu--bridge-services)

## M1Service: ABHA Creation & Management

Handles ABHA (Ayushman Bharat Health Account) creation and management through Aadhaar-based authentication.

| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `getSession(sessionRequest)` | Creates a new session for ABHA operations | `/v3/sessions` | POST |
| `sendAadhaarOTP(generateOtpRequest)` | Sends OTP to Aadhaar-linked mobile number | `/v3/enrollment/request/otp` | POST |
| `createAbhaIdByAadhaar(createAbhaRequest)` | Creates ABHA ID using Aadhaar details | `/v3/enrollment/enrol/byAadhaar` | POST |
| `getPublicKey()` | Retrieves the public key for encryption | `/v3/profile/public/certificate` | GET |

## M2Service: Health Facility & ABHA Profile

Manages health facility services and ABHA profile operations.

### Health Facility Management
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `addUpdateHealthFacilityServices(data)` | Adds or updates health facility services | `/v1/bridges/MutipleHRPAddUpdateServices` | POST |

### ABHA Profile & Authentication
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `generateToken(data)` | Generates authentication token | `/v1/hip/token/generate-token` | POST |
| `getABHAProfile(token)` | Retrieves ABHA profile information | `/v1/profile/me` | GET |
| `verifyABHAAddress(abhaAddress)` | Verifies if an ABHA address exists | `/v1/abha/address/verify` | GET |
| `linkABHAAddress(abhaNumber, abhaAddress, token)` | Links ABHA address to health ID | `/v1/abha/address/link` | POST |

### Consent Management
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `initiateConsent(consentRequest, token)` | Initiates a new consent request | `/v0.5/consent-requests/init` | POST |
| `getConsentStatus(requestId, token)` | Gets status of a consent request | `/v0.5/consent-requests/status/{requestId}` | GET |

### Health Records
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `fetchHealthRecords(options, token)` | Fetches health records | `/v1/health-records` | GET |
| `downloadHealthRecord(recordId, token)` | Downloads a specific health record | `/v1/health-records/{recordId}/download` | GET |

## M3Service: HIU & Bridge Services

Handles Health Information User (HIU) operations and bridge service management.

### Session Management
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `createSession(clientId, clientSecret)` | Creates a new session | `/v3/sessions` | POST |

### Bridge Service Management
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `updateBridgeUrl(bridgeId, url, authToken)` | Updates bridge URL | `/v3/bridges/{bridgeId}` | PATCH |
| `registerBridgeService(service, authToken)` | Registers a new bridge service | `/v3/services` | POST |
| `getBridgeService(serviceId, authToken)` | Retrieves bridge service details | `/v3/services/{serviceId}` | GET |
| `updateBridgeService(serviceId, updates, authToken)` | Updates bridge service | `/v3/services/{serviceId}` | PUT |
| `deleteBridgeService(serviceId, authToken)` | Deletes a bridge service | `/v3/services/{serviceId}` | DELETE |
| `listBridgeServices(authToken, filters)` | Lists all bridge services | `/v3/services` | GET |

### Health Information Request
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `requestHealthInfo(consentRequest, authToken)` | Requests health information | `/v0.5/health-information/request` | POST |
| `getHealthInfoStatus(requestId, authToken)` | Gets health information status | `/v0.5/health-information/status/{requestId}` | GET |
| `fetchHealthInfo(transactionId, authToken)` | Fetches health information | `/v0.5/health-information/fetch/{transactionId}` | GET |

### Consent Management
| Function | Description | ABDM API Endpoint | HTTP Method |
|----------|-------------|-------------------|-------------|
| `initiateConsent(consentRequest, authToken)` | Initiates a consent request | `/v0.5/consent-requests/init` | POST |
| `getConsentStatus(requestId, authToken)` | Gets consent request status | `/v0.5/consent-requests/status/{requestId}` | GET |
| `notifyConsentStatus(consentId, status, authToken)` | Notifies consent status | `/v0.5/consent-requests/notify` | POST |

## Error Handling

All methods return a standardized `APIResponse` object with the following structure:

```typescript
{
  status: number;      // HTTP status code
  statusText: string;   // Status message
  data?: T;             // Response data (type varies by endpoint)
  error?: {
    code: string;      // Error code
    message: string;    // Human-readable error message
    details?: any;      // Additional error details
  };
}
```

## Authentication

Most endpoints require authentication. The SDK handles token management automatically when initialized with valid client credentials. The authentication token is automatically included in subsequent requests.

## Rate Limiting

Please be aware of ABDM's rate limits:
- 100 requests per minute per client ID
- 1000 requests per day per client ID

## Support

For any issues or questions, please refer to the official ABDM documentation or contact support.
