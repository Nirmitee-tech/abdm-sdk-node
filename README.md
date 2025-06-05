# ABDM Node.js SDK

[![npm version](https://img.shields.io/npm/v/@nirmitee/abdm-sdk-node.svg?style=flat-square)](https://www.npmjs.com/package/@nirmitee/abdm-sdk-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/abdm-sdk-node/ci.yml?branch=main)](https://github.com/yourusername/abdm-sdk-node/actions)

A Node.js SDK for interacting with the Ayushman Bharat Digital Mission (ABDM) APIs. This SDK provides a simple and type-safe way to integrate with ABDM services in your Node.js applications.

## Features

- **TypeScript Support**: Full TypeScript support with type definitions
- **Modular Design**: Organized into services for different ABDM modules
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
import ABDMClient from '@nirmitee/abdm-sdk-node';

// Initialize the client with your credentials
const client = new ABDMClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  environment: 'sandbox', // or 'production'
});

// Authenticate with ABDM (automatically handles token management)
await client.authenticate();
```

### ABHA Service Examples

#### Create an ABHA ID

```typescript
try {
  const abhaData = await client.abha.createAbhaId({
    authMethod: 'aadhaar',
    authData: {
      aadhaarNumber: 'XXXXXXXXXXXX',
      name: 'John Doe',
      gender: 'M',
      yearOfBirth: '1990',
      // ... other required fields
    },
  });
  
  console.log('Created ABHA ID:', abhaData.healthId);
} catch (error) {
  console.error('Error creating ABHA ID:', error.message);
}
```

#### Search for an ABHA ID

```typescript
try {
  const searchResult = await client.abha.searchByHealthId({
    healthId: 'user@abdm',
  });
  
  console.log('Search result:', searchResult);
} catch (error) {
  console.error('Error searching ABHA ID:', error.message);
}
```

## Configuration

The `ABDMClient` accepts the following configuration options:

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `clientId` | string | Yes | - | Your ABDM client ID |
| `clientSecret` | string | Yes | - | Your ABDM client secret |
| `environment` | 'sandbox' \| 'production' | No | 'sandbox' | The ABDM environment to use |
| `baseUrl` | string | No | Environment-specific | Override the base API URL |
| `authBaseUrl` | string | No | Environment-specific | Override the authentication URL |
| `timeout` | number | No | 30000 | Request timeout in milliseconds |

## Error Handling

All API methods throw errors when something goes wrong. Errors include a descriptive message and may include additional details about what went wrong.

```typescript
try {
  await client.abha.someMethod();
} catch (error) {
  console.error('API Error:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  }
}
```

## Testing

To run the test suite:

```bash
npm test
```

To run tests in watch mode:

```bash
npm run test:watch
```

To generate a test coverage report:

```bash
npm run test:coverage
```

## Documentation

For detailed information about ABDM APIs and guidelines, please refer to the official ABDM documentation:

### API Documentation
- [ABDM API Documentation](https://abdm.gov.in:8081/uploads/abdm-docs/)
- [ABDM API Swagger Documentation](https://abdm.gov.in/swasth/abdm-docs/)

### Guidelines & Specifications
- [ABDM Sandbox Guidelines](https://abdm.gov.in:8081/uploads/sandbox_guidelines_b39bcce23e.pdf)
- [ABDM API Standards](https://abdm.gov.in:8081/uploads/abdm-api-standards_9d2f1b8f9f.pdf)
- [ABDM Technical Specifications](https://abdm.gov.in:8081/uploads/technical-specifications_1.0.0_3c1b7f6e5d.pdf)

### Integration Guides
- [Health ID Integration Guide](https://abdm.gov.in:8081/uploads/healthid-integration-guide_1.0.0_2a3b4c5d6e.pdf)
- [HIP Integration Guide](https://abdm.gov.in:8081/uploads/hip-integration-guide_1.0.0_7f8e9d0c1b.pdf)
- [HIU Integration Guide](https://abdm.gov.in:8081/uploads/hiu-integration-guide_1.0.0_4d5e6f7a8b.pdf)

### Additional Resources
- [ABDM Developer Portal](https://sandbox.abdm.gov.in/)
- [ABDM API Status](https://status.abdm.gov.in/)
- [ABDM Support](https://abdm.gov.in/support)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please:
1. Check the [ABDM Developer Portal](https://sandbox.abdm.gov.in/)
2. Review the [ABDM Documentation](https://abdm.gov.in:8081/uploads/abdm-docs/)
3. Open an issue in the [GitHub repository](https://github.com/Nirmitee-tech/abdm-sdk-node/issues)

For official ABDM support, please contact [ABDM Support](https://abdm.gov.in/support)
