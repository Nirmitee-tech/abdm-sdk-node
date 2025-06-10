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
    healthFacilityId: 'FAC123',
    name: 'Sample Health Facility',
    type: 'HOSPITAL',
    address: '123 Health St, City',
    pincode: '110001',
    state: 'Delhi',
    district: 'New Delhi',
    contactNumber: '+911234567890',
    email: 'facility@example.com',
    services: ['OPD', 'IPD', 'EMERGENCY']
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
    purpose: 'TREATMENT',
    patient: {
      id: 'user@abdm',
      name: 'John Doe',
      gender: 'M',
      yearOfBirth: '1990',
      address: '123 Main St, City',
      identifiers: [
        { type: 'MOBILE', value: '+919876543210' }
      ]
    },
    hiTypes: ['Prescription', 'DiagnosticReport'],
    permission: {
      accessMode: 'VIEW',
      dateRange: {
        from: '2025-01-01T00:00:00.000Z',
        to: '2025-12-31T23:59:59.999Z'
      },
      dataEraseAt: '2026-01-31T23:59:59.999Z'
    }
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

## Logging

The SDK uses [Pino](https://getpino.io/) for logging. By default, logs are written to both the console (pretty-printed) and a file (`logs/abdm-sdk.log`).

### Log Levels

You can control the log level using the `LOG_LEVEL` environment variable:

- `trace`: Log everything (most verbose)
- `debug`: Debug information
- `info`: General information (default)
- `warn`: Warnings
- `error`: Errors only
- `fatal`: Fatal errors only

Example:
```bash
LOG_LEVEL=debug node your-script.js
```

### Log File Rotation

For production use, consider using a log rotation tool like:
- [logrotate](https://linux.die.net/man/8/logrotate) (Linux)
- [rotating-file-stream](https://www.npmjs.com/package/rotating-file-stream) (Node.js)

### Example Usage

```typescript
import { logger } from '@nirmitee/abdm-sdk-node';

// Log at different levels
logger.trace('Trace message');
logger.debug('Debug information', { some: 'data' });
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error message', new Error('Something went wrong'));
logger.fatal('Fatal error', { error: new Error('Critical failure') });

// Log with context
logger.info('User logged in', {
  userId: '123',
  timestamp: new Date().toISOString()
});
```

### Log Format

Logs include the following fields by default:
- `level`: The log level (trace, debug, info, warn, error, fatal)
- `time`: ISO timestamp
- `msg`: The log message
- Additional context objects are merged into the log entry

### Disabling File Logging

To disable file logging, set the `DISABLE_FILE_LOGGING` environment variable to `true`:

```bash
DISABLE_FILE_LOGGING=true node your-script.js
```

### Custom Logger

You can provide a custom logger instance that follows the Pino interface:

```typescript
import pino from 'pino';

const customLogger = pino({
  // Your custom Pino configuration
});

// Use the custom logger
logger.setLogger(customLogger);
```

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
  // Example: Verify if ABHA address exists
  const response = await client.m2.verifyABHAAddress('user@abdm');
  if (!response.success) {
    console.error('API Error:', response.error?.message);
    
    // Handle specific error cases
    if (response.error?.code === 'INVALID_TOKEN') {
      // Re-authenticate and retry
      await client.authenticate();
      const retryResponse = await client.m2.verifyABHAAddress('user@abdm');
      console.log('Retry result:', retryResponse);
    }
    return;
  }
  
  // Process successful response
  console.log('ABHA address exists:', response.data.exists);
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
