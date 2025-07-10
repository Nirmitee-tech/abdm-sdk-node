# ABDM Node.js SDK

[![npm version](https://img.shields.io/npm/v/@nirmitee/abdm-sdk-node)](https://www.npmjs.com/package/@nirmitee/abdm-sdk-node)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

Node.js SDK for Ayushman Bharat Digital Mission (ABDM) API. This SDK provides a simple and type-safe way to interact with ABDM's healthcare APIs.

## ✨ Features

- **TypeScript Support**: Full TypeScript support with type definitions
- **Comprehensive API Coverage**: Covers all major ABDM APIs
- **Promise-based**: All API calls return Promises
- **Configurable**: Customize HTTP client and other options
- **Well-tested**: Comprehensive test suite
- **Production-ready**: Used in production by Nirmitee

## 📦 Installation

```bash
# Using npm
npm install @nirmitee/abdm-sdk-node

# Using yarn
yarn add @nirmitee/abdm-sdk-node

# Using pnpm
pnpm add @nirmitee/abdm-sdk-node
```

## 🔧 Prerequisites

- Node.js 16.0.0 or higher
- TypeScript 4.0.0 or higher (for TypeScript projects)
- Valid ABDM API credentials

## 🚀 Quick Start

### Basic Setup

```typescript
import { ABDMClient } from '@nirmitee/abdm-sdk-node';

// Initialize the client
const client = new ABDMClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  baseUrl: 'https://dev.abdm.gov.in', // Use appropriate environment URL
  // other optional config
});

// Example: Generate Aadhaar OTP
async function generateAadhaarOTP() {
  try {
    const response = await client.auth.generateAadhaarOTP({
      aadhaar: '123456789012',
      txnId: 'unique-transaction-id-123'
    });
    console.log('Aadhaar OTP sent:', response);
    return response;
  } catch (error) {
    console.error('Error generating Aadhaar OTP:', error);
    throw error;
  }
}

// Execute the function
generateAadhaarOTP();
```

## 📚 API Reference

### Available Services

- **`auth`**: Authentication and user management
  - `generateAadhaarOTP()`: Generate OTP for Aadhaar authentication
  - `verifyAadhaarOTP()`: Verify Aadhaar OTP
  - `generateMobileOTP()`: Generate OTP for mobile authentication
  - `verifyMobileOTP()`: Verify mobile OTP
  - `getAuthToken()`: Get authentication token

- **`consent`**: Consent management
  - `createConsent()`: Create a new consent
  - `getConsentStatus()`: Get consent status
  - `revokeConsent()`: Revoke consent

- **`health`**: Health record services
  - `getHealthRecords()`: Fetch health records
  - `shareHealthRecords()`: Share health records

### Configuration Options

```typescript
interface ABDMConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  timeout?: number; // Request timeout in milliseconds (default: 30000)
  maxRetries?: number; // Maximum retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 1000)
  debug?: boolean; // Enable debug logging (default: false)
}
```

## 🛠 Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nirmitee-tech/abdm-sdk-node.git
   cd abdm-sdk-node
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   # Run all tests
   npm test
   
   # Run unit tests
   npm run test:unit
   
   # Run integration tests
   npm run test:integration
   
   # Run tests with coverage
   npm run test:coverage
   ```

5. **Lint and format code**
   ```bash
   # Lint code
   npm run lint
   
   # Format code
   npm run format
   ```

## 🛠 Troubleshooting SSL/Crypto Issues

### Node.js & OpenSSL Requirements
- Node.js 16.0.0 or higher is required.
- OpenSSL 1.x or 3.x is required (Node.js uses OpenSSL under the hood).

### Common Errors & Solutions
- **Encryption failed: unsupported** or **Failed to create public key object**: Your Node.js or OpenSSL version may be too old or incompatible. Upgrade Node.js to the latest LTS version.
- **OpenSSL legacy provider required**: On Node.js 17+ with OpenSSL 3, you may need to run your app with:
  
  ```sh
  node --openssl-legacy-provider your-app.js
  ```
- **Insecure SSL warning in production**: Never set `NODE_TLS_REJECT_UNAUTHORIZED=0` or use `rejectUnauthorized: false` in production. This is only for sandbox/testing.

### Still Stuck?
- Check your Node.js version: `node -v`
- Check your OpenSSL version: `node -p "process.versions.openssl"`
- If you see errors, upgrade Node.js or consult the SDK documentation/issues.

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Nirmitee - [@NirmiteeTech](https://twitter.com/NirmiteeTech) - hello@nirmitee.io

Project Link: [https://github.com/Nirmitee-tech/abdm-sdk-node](https://github.com/Nirmitee-tech/abdm-sdk-node)

## 🙏 Acknowledgments

- [Ayushman Bharat Digital Mission](https://abdm.gov.in/)
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
