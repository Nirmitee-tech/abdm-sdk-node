/**
 * Core types for the ABDM SDK
 */

// Common types
export * from './common';

// Authentication types
export type {
  AadhaarOtpResponse,
  CreateAbhaRequest,
  CreateAbhaResponse,
  GenerateAadhaarOtpRequest,
  GenerateOtpRequest,
  GenerateOtpResponse
} from './auth';

// Health service types
export type {
  ABHAProfileResponse,
  ConsentRequest,
  ConsentResponse,
  FetchRecordsOptions,
  HealthFacilityData,
  HealthFacilityRequest,
  HealthFacilityResponse,
  HealthRecord,
  HealthRecordsResponse,
  M2ABHAProfileData
} from './health';

// Consent service types
export type {
  BridgeServiceRegistrationRequest,
  BridgeServiceResponse,
  BridgeServicesResponse,
  ConsentStatusResponse,
  HealthInformationRequest,
  HealthInformationResponse
} from './consent';

