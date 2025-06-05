/**
 * Health Facility Management Workflow Example
 * 
 * This example demonstrates how to use the M2 service to:
 * 1. Register and manage a health facility
 * 2. Link a health professional to the facility
 * 3. Search for a patient's ABHA profile
 * 4. Request and manage health records consent
 * 5. Fetch health records
 */

import { ABDMClient } from '../src/abdm-client';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Configuration
const config = {
  clientId: process.env.ABDM_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.ABDM_CLIENT_SECRET || 'your-client-secret',
  environment: (process.env.ABDM_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
};

// Test data
const testData = {
  // Facility details
  facility: {
    id: `FAC-${uuidv4().substring(0, 8)}`,
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
  },
  
  // Health professional details
  doctor: {
    id: `DOC-${uuidv4().substring(0, 8)}`,
    name: 'Dr. Smith Johnson',
    gender: 'M',
    type: 'DOCTOR',
    qualification: 'MD, MBBS',
    specialization: 'CARDIOLOGY',
  },
  
  // Patient ABHA details (for demo purposes)
  patientAbhaId: 'user@abdm', // Replace with actual ABHA ID in production
};

// Initialize the client
const client = new ABDMClient(config);

async function runHealthFacilityWorkflow() {
  console.log('=== Starting Health Facility Workflow ===\n');

  try {
    // 1. Authenticate with ABDM
    console.log('1. Authenticating with ABDM...');
    await client.authenticate();
    console.log('✅ Authentication successful!\n');

    // 2. Register/Update Health Facility
    console.log('2. Registering/Updating health facility...');
    const facilityResponse = await client.m2.registerHealthFacility({
      facilityId: testData.facility.id,
      name: testData.facility.name,
      type: testData.facility.type,
      services: testData.facility.services,
      address: testData.facility.address,
      contact: testData.facility.contact,
    });
    console.log('✅ Health facility registered/updated successfully!');
    console.log(`Facility ID: ${facilityResponse.facilityId}\n`);

    // 3. Add/Update Health Professional
    console.log('3. Adding/Updating health professional...');
    const doctorResponse = await client.m2.addUpdateHealthProfessional({
      professionalId: testData.doctor.id,
      name: testData.doctor.name,
      gender: testData.doctor.gender,
      type: testData.doctor.type,
      qualification: testData.doctor.qualification,
      specialization: testData.doctor.specialization,
      facilityId: testData.facility.id,
    });
    console.log('✅ Health professional added/updated successfully!');
    console.log(`Professional ID: ${doctorResponse.professionalId}\n`);

    // 4. Search for Patient by ABHA ID
    console.log('4. Searching for patient by ABHA ID...');
    const searchResponse = await client.m2.searchByAbhaId({
      abhaId: testData.patientAbhaId,
    });
    console.log('✅ Patient found!');
    console.log(`Patient Name: ${searchResponse.name}`);
    console.log(`ABHA Address: ${searchResponse.abhaAddress}`);
    console.log(`Date of Birth: ${searchResponse.dateOfBirth}\n`);

    // 5. Request Consent for Health Records
    console.log('5. Requesting consent for health records...');
    const consentRequest = await client.m2.requestConsent({
      abhaId: testData.patientAbhaId,
      consentType: 'HEALTH_RECORD',
      purpose: 'TREATMENT',
      hiTypes: ['OPConsultation', 'DiagnosticReport', 'Prescription'],
      dateFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
      dateTo: new Date(),
      expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    });
    console.log('✅ Consent request created!');
    console.log(`Consent Request ID: ${consentRequest.requestId}`);
    console.log(`Consent Token: ${consentRequest.token}\n`);

    // Note: In a real application, the patient would approve this consent
    // through their ABHA app. For demo purposes, we'll simulate approval.
    console.log('Please approve the consent request in your ABHA app...');
    // Simulating waiting for user to approve consent
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

    // 6. Check Consent Status
    console.log('6. Checking consent status...');
    const consentStatus = await client.m2.getConsentStatus({
      requestId: consentRequest.requestId,
    });
    console.log('Consent Status:', consentStatus.status);
    
    if (consentStatus.status === 'GRANTED') {
      console.log('✅ Consent granted! Fetching health records...');
      
      // 7. Fetch Health Records
      const healthRecords = await client.m2.getHealthRecords({
        consentToken: consentRequest.token,
      });
      
      console.log('✅ Health records retrieved successfully!');
      console.log('Number of records:', healthRecords.entries?.length || 0);
      
      if (healthRecords.entries && healthRecords.entries.length > 0) {
        console.log('Sample record:', JSON.stringify(healthRecords.entries[0], null, 2));
      }
    } else {
      console.log('Consent not yet granted. Please try again later.');
    }

    console.log('\n=== Health Facility Workflow Completed Successfully ===');

  } catch (error) {
    console.error('❌ Error in Health Facility Workflow:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    throw error;
  }
}

// Run the health facility workflow
runHealthFacilityWorkflow()
  .catch(error => {
    console.error('Health Facility Workflow failed:', error);
    process.exit(1);
  });
