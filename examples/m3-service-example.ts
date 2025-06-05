/**
 * M3 Service Example
 * 
 * This example demonstrates how to use the M3 service to:
 * 1. Create a session
 * 2. Manage bridge services
 * 3. Handle HIU consent requests
 * 4. Process health information requests
 */

import ABDMClient from '../src';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  clientId: process.env.ABDM_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.ABDM_CLIENT_SECRET || 'your-client-secret',
  environment: (process.env.ABDM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

// Initialize the client
const client = new ABDMClient(config);

async function runM3Examples() {
  try {
    // 1. Create a session
    console.log('1. Creating a session...');
    const session = await client.m3.createSession(
      config.clientId,
      config.clientSecret
    );
    console.log('✅ Session created successfully');
    console.log('Access Token:', session.accessToken.substring(0, 20) + '...');
    console.log('Expires in:', session.expiresIn, 'seconds');
    console.log('---');

    const authToken = session.accessToken;
    const bridgeId = 'YOUR_BRIDGE_ID'; // Replace with your bridge ID

    // 2. Update Bridge URL
    console.log('2. Updating bridge URL...');
    const updateResponse = await client.m3.updateBridgeUrl(
      bridgeId,
      'https://your-bridge-url.com/callback',
      authToken
    );
    console.log('✅ Bridge URL updated:', updateResponse.success);
    console.log('---');

    // 3. Register a Bridge Service
    console.log('3. Registering a new bridge service...');
    const serviceData = {
      id: 'YOUR_SERVICE_ID',
      name: 'Health Service Provider',
      types: ['HIP', 'HIU'],
      endpoints: {
        hipEndpoints: [
          {
            use: 'registration',
            connectionType: 'HTTPS',
            address: 'https://your-service.com/api/registration',
          },
          {
            use: 'data-upload',
            connectionType: 'HTTPS',
            address: 'https://your-service.com/api/data-upload',
          },
        ],
        hiuEndpoints: [
          {
            use: 'registration',
            connectionType: 'HTTPS',
            address: 'https://your-service.com/api/hiu/registration',
          },
        ],
      },
      active: true,
    };

    const serviceResponse = await client.m3.registerBridgeService(
      serviceData,
      authToken
    );
    console.log('✅ Service registered successfully');
    console.log('Service ID:', serviceResponse.id);
    console.log('Service Name:', serviceResponse.name);
    console.log('---');

    // 4. Find Services by Bridge ID
    console.log('4. Finding services by bridge ID...');
    const services = await client.m3.findServicesByBridgeId(bridgeId, authToken);
    console.log(`✅ Found ${services.services.length} services`);
    services.services.forEach((service, index) => {
      console.log(`  ${index + 1}. ${service.name} (${service.id})`);
      console.log(`     Types: ${service.types.join(', ')}`);
      console.log(`     Active: ${service.active}`);
    });
    console.log('---');

    // 5. Initialize Consent Request
    console.log('5. Initializing consent request...');
    const consentRequest = {
      requestId: 'req_' + Date.now(),
      timestamp: new Date().toISOString(),
      consent: {
        purpose: {
          text: 'Continuity of care',
          code: 'CAREMGT',
          refUri: 'https://example.org/policies/privacy',
        },
        patient: {
          id: 'john.doe@abdm',
        },
        hiTypes: ['Prescription', 'DiagnosticReport'],
        permission: {
          accessMode: 'VIEW',
          dateRange: {
            from: new Date().toISOString(),
            to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          dataEraseAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          frequency: {
            unit: 'HOUR',
            value: '1',
            repeats: 1,
          },
        },
      },
    };

    const consentResponse = await client.m3.initConsentRequest(
      consentRequest,
      authToken
    );
    console.log('✅ Consent request initialized');
    console.log('Request ID:', consentResponse.requestId);
    console.log('---');

    // 6. Check Consent Request Status
    console.log('6. Checking consent request status...');
    const requestId = consentResponse.requestId;
    const consentStatus = await client.m3.getConsentRequestStatus(
      requestId,
      authToken
    );
    console.log('Consent Status:', consentStatus.consentRequest.status);
    if (consentStatus.consentRequest.consentArtefacts) {
      console.log('Consent Artefacts:', consentStatus.consentRequest.consentArtefacts.length);
    }
    console.log('---');

    // 7. Request Health Information
    console.log('7. Requesting health information...');
    const healthInfoRequest = {
      requestId: 'health_req_' + Date.now(),
      timestamp: new Date().toISOString(),
      hiRequest: {
        consentId: consentStatus.consentRequest.consentArtefacts?.[0]?.id || 'consent_123',
        dateRange: {
          from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: new Date().toISOString(),
        },
        dataPushUrl: 'https://your-service.com/api/health-data',
        keyMaterial: {
          cryptoAlg: 'ECDH',
          curve: 'Curve25519',
          dhPublicKey: {
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            keyValue: 'base64-encoded-public-key',
            parameters: 'Curve25519/32byte random key',
          },
          nonce: 'base64-encoded-nonce',
        },
      },
    };

    const healthInfoResponse = await client.m3.requestHealthInformation(
      healthInfoRequest,
      authToken
    );
    console.log('✅ Health information requested');
    console.log('Request ID:', healthInfoResponse.requestId);
    console.log('---');

    console.log('🎉 M3 Service Examples Completed Successfully!');
  } catch (error: any) {
    console.error('❌ Error in M3 Example:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the examples
runM3Examples();
