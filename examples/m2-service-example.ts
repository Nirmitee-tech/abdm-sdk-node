/**
 * M2 Service Example
 * 
 * This example demonstrates how to use the M2 service to:
 * 1. Authenticate with ABDM
 * 2. Manage health facilities
 * 3. Work with ABHA profiles
 * 4. Handle consents and health records
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

async function runM2Examples() {
  try {
    // 1. Authenticate
    console.log('1. Authenticating with ABDM...');
    await client.authenticate();
    console.log('✅ Successfully authenticated with ABDM');
    console.log('---');

    // 2. Add/Update Health Facility Services
    console.log('2. Adding/Updating health facility services...');
    const facilityData = {
      facilityId: 'FACILITY_123',
      name: 'City General Hospital',
      type: 'HOSPITAL',
      services: ['OPD', 'IPD', 'EMERGENCY'],
      address: {
        line: '456 Health St',
        district: 'Bangalore',
        state: 'Karnataka',
        pincode: '560100',
      },
      contact: {
        phone: '08012345678',
        email: 'contact@cityhospital.com',
      },
    };

    const facilityResponse = await client.m2.addUpdateHealthFacilityServices(facilityData);
    console.log('✅ Health facility services updated');
    console.log('Facility ID:', facilityResponse.facilityId);
    console.log('---');

    // 3. Get Health Facility Details
    console.log('3. Getting health facility details...');
    const facilityId = facilityResponse.facilityId;
    const facilityDetails = await client.m2.getHealthFacility(facilityId);
    console.log('✅ Facility details retrieved');
    console.log('Facility Name:', facilityDetails.name);
    console.log('Active Services:', facilityDetails.services);
    console.log('---');

    // 4. Update ABHA Profile
    console.log('4. Updating ABHA profile...');
    const profileUpdate = {
      name: 'John R. Doe',
      gender: 'M',
      dateOfBirth: '1990-01-01',
      address: {
        line: '123 Main St',
        district: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
      },
      identifiers: [
        {
          type: 'MOBILE',
          value: '9876543210',
        },
      ],
    };

    const authToken = 'your-auth-token'; // Get this from login/authentication
    const profileResponse = await client.m2.updateABHAProfile(profileUpdate, authToken);
    console.log('✅ Profile updated successfully');
    console.log('Profile ID:', profileResponse.profileId);
    console.log('---');

    // 5. Search ABHA Profiles
    console.log('5. Searching ABHA profiles...');
    const searchResults = await client.m2.searchABHAProfiles(
      'John',
      authToken
    );
    console.log('✅ Search completed');
    console.log(`Found ${searchResults.length} matching profiles`);
    console.log('---');

    // 6. Fetch Health Records
    console.log('6. Fetching health records...');
    const patientId = 'PATIENT_123'; // Replace with actual patient ID
    const records = await client.m2.fetchHealthRecords(
      patientId,
      authToken,
      {
        fromDate: '2023-01-01',
        toDate: '2023-12-31',
        hiTypes: ['OPConsultation', 'Prescription'],
        limit: 10,
      }
    );
    console.log('✅ Health records retrieved');
    console.log(`Found ${records.length} records`);
    if (records.length > 0) {
      console.log('Latest record type:', records[0].type);
      console.log('Date:', records[0].date);
    }
    console.log('---');

    // 7. Create Consent
    console.log('7. Creating consent request...');
    const consentRequest = {
      purpose: {
        text: 'Continuity of care',
        code: 'CAREMGT',
      },
      patient: {
        id: patientId,
      },
      hiTypes: ['Prescription', 'DiagnosticReport'],
      permission: {
        accessMode: 'VIEW',
        dateRange: {
          from: '2023-01-01T00:00:00.000Z',
          to: '2023-12-31T23:59:59.999Z',
        },
        dataEraseAt: '2024-12-31T23:59:59.999Z',
        frequency: {
          unit: 'HOUR',
          value: '1',
        },
      },
    };

    const consentResponse = await client.m2.createConsent(consentRequest, authToken);
    console.log('✅ Consent request created');
    console.log('Consent ID:', consentResponse.consentId);
    console.log('Request ID:', consentResponse.requestId);
    console.log('---');

    console.log('🎉 M2 Service Examples Completed Successfully!');
  } catch (error: any) {
    console.error('❌ Error in M2 Example:', error.message);
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the examples
runM2Examples();
