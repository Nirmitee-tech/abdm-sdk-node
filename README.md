# ABDM Node.js SDK

[![npm version](https://img.shields.io/npm/v/@nirmitee/abdm-sdk-node.svg?style=flat-square)](https://www.npmjs.com/package/@nirmitee/abdm-sdk-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/Nirmitee-tech/abdm-sdk-node/actions/workflows/ci.yml/badge.svg)](https://github.com/Nirmitee-tech/abdm-sdk-node/actions)

A TypeScript/Node.js SDK for interacting with the Ayushman Bharat Digital Mission (ABDM) APIs. This SDK provides a simple and type-safe way to integrate with ABDM services in your Node.js applications.

## Features

- **TypeScript Support**: Full TypeScript support with type definitions
- **Modular Design**: Organized into services for different ABDM modules (M1, M2, M3)
- **Authentication**: Handles authentication and token management
- **Error Handling**: Consistent error handling across all API calls
- **Testing**: Comprehensive test suite with Jest
- **Documentation**: JSDoc comments for all public APIs

## Installation

### Using npm

```bash
npm install @nirmitee/abdm-sdk-node
```

### Using Yarn

```bash
yarn add @nirmitee/abdm-sdk-node
```

### Using pnpm

```bash
pnpm add @nirmitee/abdm-sdk-node
```

### Requirements

- Node.js 14.0.0 or higher
- npm 6.0.0+ / Yarn 1.22.0+ / pnpm 6.0.0+

## Usage

### Basic Setup

```typescript
import { ABDMClient } from '@nirmitee/abdm-sdk-node';

// Initialize the client with your credentials
const client = new ABDMClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  basePath: 'https://dev.abdm.gov.in/gateway', // optional
  useSandbox: true, // optional, defaults to true
});

// Authenticate with ABDM (handles token management)
await client.authenticate();
```

## Available Services

The SDK is organized into the following services, each corresponding to different ABDM modules:

### M1Service (`client.m1`)
- ABHA enrollment and management
- Aadhaar-based authentication
- Mobile and email verification
- ABHA address management

### M2Service (`client.m2`)
- Health facility management
- ABHA profile operations
- Consent management
- Health record access

### M3Service (`client.m3`)
- HIU (Health Information User) operations
- Bridge service management
- Health information requests
- Consent request handling

## Examples

### M1 Service: ABHA Enrollment

#### Send Aadhaar OTP

```typescript
try {
  const response = await client.m1.sendAadhaarOTP('123456789012');
  console.log('OTP sent. Transaction ID:', response.data.txnId);
  
  // Store txnId for verification step
  const txnId = response.data.txnId;
} catch (error) {
  console.error('Error sending OTP:', error.message);
}
```

#### Verify OTP and Create ABHA

```typescript
try {
  const response = await client.m1.verifyAadhaarOTPAndCreateABHA(
    '123456', // OTP received on mobile
    'txn-1234567890', // Transaction ID from sendAadhaarOTP
    'user@abdm' // Optional preferred ABHA address
  );
  
  console.log('ABHA created successfully:', {
    healthId: response.data.healthId,
    name: response.data.name,
    gender: response.data.gender,
    yearOfBirth: response.data.yearOfBirth
  });
} catch (error) {
  console.error('Error creating ABHA:', error.message);
}
```

### M2 Service: Health Facility Management

#### Add/Update Health Facility Services

```typescript
try {
  const facilityData = {
    // Required facility information
    healthFacilityId: 'FAC123',
    name: 'Sample Health Facility',
    // ... other facility details
  };
  
  const response = await client.m2.addUpdateHealthFacilityServices(facilityData);
  console.log('Facility services updated:', response);
} catch (error) {
  console.error('Error updating facility services:', error.message);
}
```

### M3 Service: Health Information Requests

#### Request Health Information

```typescript
try {
  const consentRequest = {
    // Consent request details
    purpose: 'TREATMENT',
    patient: {
      id: 'user@abdm',
      // ... patient details
    },
    // ... other consent parameters
  };
  
  const response = await client.m3.requestHealthInformation(consentRequest);
  console.log('Health information request submitted. Request ID:', response.requestId);
} catch (error) {
  console.error('Error requesting health information:', error.message);
}
```

## Configuration

The `ABDMClient` accepts the following configuration options:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `clientId` | string | Yes | - | Your ABDM client ID |
| `clientSecret` | string | Yes | - | Your ABDM client secret |
| `basePath` | string | No | `'https://dev.abdm.gov.in/gateway'` | Base URL for ABDM API |
| `useSandbox` | boolean | No | `true` | Whether to use sandbox environment |
| `timeout` | number | No | `30000` | Request timeout in milliseconds |

## Error Handling

All API methods return a standardized response object with the following structure:

```typescript
{
  success: boolean;      // Whether the request was successful
  data?: T;              // Response data on success
  error?: {
    code: string;      // Error code
    message: string;    // Human-readable error message
    details?: any;      // Additional error details
  };
}
```

Example error handling:

```typescript
try {
  const response = await client.m1.someMethod();
  if (!response.success) {
    console.error('API Error:', response.error?.message);
    // Handle specific error codes
    if (response.error?.code === 'INVALID_TOKEN') {
      // Handle token refresh or re-authentication
    }
    return;
  }
  
  // Use response.data
  console.log('Success:', response.data);
} catch (error) {
  console.error('Unexpected error:', error);
}
```

## Development

### Prerequisites

- Node.js 14+
- npm, yarn, or pnpm
- TypeScript 4.0+

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Nirmitee-tech/abdm-sdk-node.git
   cd abdm-sdk-node
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   # or
   pnpm install
   ```

### Building

```bash
npm run build
```

### Testing

Run unit tests:

```bash
npm test
```

Run integration tests (requires valid ABDM credentials):

```bash
npm run test:integration
```

Generate test coverage report:

```bash
npm run test:coverage
```

### Linting and Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the [GitHub repository](https://github.com/Nirmitee-tech/abdm-sdk-node/issues).

## Security

Please ensure you never commit your ABDM credentials or any sensitive information to version control. Use environment variables or a secure secret management system in production environments.

## Additional Resources

- [ABDM Developer Portal](https://sandbox.abdm.gov.in/)
- [ABDM API Status](https://status.abdm.gov.in/)
- [ABDM Support](https://abdm.gov.in/support)
