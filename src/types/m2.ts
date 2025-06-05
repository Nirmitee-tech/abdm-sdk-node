import { APIResponse } from './common';

// Health Facility Types
export interface HealthFacilityRequest {
  facilityId: string;
  facilityName: string;
  HRP: Array<{
    bridgeId: string;
    hipName: string;
    type: 'HIP' | 'HIU' | 'HRP' | 'HFR' | 'HFRM' | 'HIE-CM' | 'HIE-EMR' | 'HIE-HRP' | 'HIE-IPD' | 'HIE-LAB' | 'HIE-PHR' | 'HIE-PHRM' | 'HIE-PMS' | 'HIE-SU' | 'HIE-TM' | 'HIE-TP';
    active: boolean;
  }>;
}

export interface HealthFacilityResponse extends APIResponse {
  data: {
    facilityId: string;
    facilityName: string;
    HRP: Array<{
      bridgeId: string;
      hipName: string;
      type: string;
      active: boolean;
      createdDate: string;
      updatedDate: string;
    }>;
  };
}

export interface GenerateTokenRequest {
  abhaAddress: string;
  linkToken: string;
  // The 'response' field containing 'requestId' was removed as it's not standard for a request payload.
  // If the API expects a requestId in the request, it should be a direct field like 'requestId?: string;'.
}

export interface GenerateTokenResponse extends APIResponse {
  data: {
    token: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
  };
}

// Consent Types
export interface ConsentRequest {
  consentId?: string;
  patientId: string;
  purpose: string;
  hiTypes: string[];
  permission: {
    accessMode: 'VIEW' | 'STORE' | 'QUERY' | 'STREAM';
    dateRange: {
      from: string;
      to: string;
    };
    dataEraseAt: string;
    frequency: {
      unit: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';
      value: number;
      repeats: number;
    };
  };
  requester: {
    name: string;
    identifier: {
      type: 'REGNO' | 'SYSTEM' | 'DOCTOR' | 'NA';
      value: string;
    };
  };
  hiu: {
    id: string;
    name: string;
  };
  hip?: {
    id: string;
    name: string;
  };
}

export interface ConsentResponse extends APIResponse {
  data: {
    consentId: string;
    status: 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
    consentDetail: ConsentRequest;
    signature: string;
    createdAt: string;
    lastUpdated: string;
  };
}

// Health Record Types
export interface FetchRecordsOptions {
  fromDate?: string;
  toDate?: string;
  hiTypes?: string[];
  limit?: number;
  offset?: number;
}

export interface HealthRecord {
  id: string;
  title: string;
  hiType: string;
  category: string;
  content: any;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecordsResponse extends APIResponse {
  data: {
    records: HealthRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ABHAProfileResponse extends APIResponse {
  data: {
    abhaNumber: string;
    preferredAbhaAddress: string;
    mobile: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    name: string;
    yearOfBirth: string;
    dayOfBirth: string;
    monthOfBirth: string;
    gender: 'M' | 'F' | 'O' | 'U';
    profilePhoto: string;
    status: string;
    stateCode: string;
    districtCode: string;
    pincode: string;
    address: string;
    kycPhoto: string;
    stateName: string;
    districtName: string;
    subdistrictName: string;
    authMethods: string[];
    tags: Record<string, unknown>;
    kycVerified: boolean;
    verificationStatus: string;
    verificationType: string;
    localizedDetails: {
      name: string;
      stateName: string;
      districtName: string;
      villageName: string;
      townName: string;
      gender: string;
      localizedLabels: Record<string, string>;
    };
    createdDate: string;
  };
}
