import { APIResponse } from './common';

export interface HealthFacilityRequest {
  /**
   * The ID of the health facility
   */
  facilityId: string;
  
  /**
   * The name of the health facility
   */
  facilityName: string;
  
  /**
   * The type of health facility (HOSPITAL, CLINIC, LAB, PHARMACY, etc.)
   */
  facilityType: string;
  
  /**
   * The address of the health facility
   */
  address: {
    addressLine1: string;
    addressLine2?: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  /**
   * Contact information for the health facility
   */
  contact: {
    phone: string[];
    email?: string[];
    website?: string;
  };
  
  /**
   * The services offered by the health facility
   */
  services: string[];
  
  /**
   * The HRP (Health Record Provider) details
   */
  hrpDetails: {
    hrpId: string;
    hrpName: string;
    hrpType: string;
    hipId?: string;
  };
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

export interface HealthFacilityData {
  /**
   * The ID of the health facility
   */
  id: string;
  
  /**
   * The name of the health facility
   */
  name: string;
  
  /**
   * The type of health facility
   */
  type: string;
  
  /**
   * The address of the health facility
   */
  address: {
    addressLine1: string;
    addressLine2?: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  /**
   * Contact information
   */
  contact: {
    phone: string[];
    email?: string[];
    website?: string;
  };
  
  /**
   * The services offered
   */
  services: string[];
  
  /**
   * HRP (Health Record Provider) details
   */
  hrpDetails: {
    hrpId: string;
    hrpName: string;
    hrpType: string;
    hipId?: string;
  };
  
  /**
   * Whether the facility is active
   */
  active: boolean;
  
  /**
   * The timestamp when the facility was created
   */
  createdAt: string;
  
  /**
   * The timestamp when the facility was last updated
   */
  updatedAt: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

export interface HealthFacilityResponse extends APIResponse<HealthFacilityData> {}

export interface ConsentRequest {
  /**
   * The purpose of the consent request
   */
  purpose: {
    text: string;
    code: string;
    refUri?: string;
  };
  
  /**
   * The patient details
   */
  patient: {
    id: string;
    name?: string;
    gender?: string;
    dateOfBirth?: string;
    abhaAddress?: string;
    abhaNumber?: string;
  };
  
  /**
   * The health information types being requested
   */
  hiTypes: string[];
  
  /**
   * The consent manager details
   */
  requester: {
    name: string;
    identifier: {
      type: 'REGNO' | 'NAME';
      value: string;
      system: string;
    };
  };
  
  /**
   * The health information user details
   */
  hiu: {
    id: string;
    name: string;
  };
  
  /**
   * The health information provider details
   */
  hip?: {
    id: string;
    name: string;
  };
  
  /**
   * The consent expiry date-time in ISO 8601 format
   */
  consentExpiry: string;
  
  /**
   * Additional context for the consent request
   */
  context?: Record<string, any>;
}

export interface ConsentResponse {
  /**
   * The status of the consent request
   */
  status: 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'FAILED';
  
  /**
   * The consent request ID
   */
  requestId: string;
  
  /**
   * The consent artefact details
   */
  consentArtefact?: {
    id: string;
    status: 'GRANTED' | 'DENIED' | 'EXPIRED' | 'FAILED';
    createdAt: string;
    expiresAt: string;
    hiu: {
      id: string;
      name: string;
    };
    patient: {
      id: string;
      name?: string;
    };
    consentDetail: {
      purpose: {
        text: string;
        code: string;
      };
      hiTypes: string[];
      consentManager: {
        id: string;
        name: string;
      };
      hiu: {
        id: string;
        name: string;
      };
      hip?: {
        id: string;
        name: string;
      };
      careContexts: Array<{
        patientReference: string;
        careContextReference: string;
      }>;
      consentStart: string;
      consentEnd: string;
      consentExpiry: string;
      consentId: string;
      createdAt: string;
    };
    signature: string;
  };
  
  /**
   * Error details if the request failed
   */
  error?: {
    code: number;
    message: string;
  };
}

export interface HealthRecordsResponse {
  /**
   * The list of health records
   */
  records: HealthRecord[];
  
  /**
   * The pagination details
   */
  page: {
    /**
     * The current page number (1-based)
     */
    current: number;
    
    /**
     * The number of records per page
     */
    size: number;
    
    /**
     * The total number of records
     */
    total: number;
    
    /**
     * The total number of pages
     */
    totalPages: number;
  };
}

export interface HealthRecord {
  /**
   * The unique identifier for the health record
   */
  id: string;
  
  /**
   * The type of health record (e.g., PRESCRIPTION, DIAGNOSTIC_REPORT, DISCHARGE_SUMMARY)
   */
  type: string;
  
  /**
   * The title or name of the health record
   */
  title: string;
  
  /**
   * A brief description of the health record
   */
  description?: string;
  
  /**
   * The date and time when the health record was created
   */
  date: string;
  
  /**
   * The healthcare facility or provider that created this record
   */
  provider: {
    id: string;
    name: string;
    type: string;
  };
  
  /**
   * The patient this record belongs to
   */
  patient: {
    id: string;
    name?: string;
    abhaNumber?: string;
    abhaAddress?: string;
  };
  
  /**
   * The category of the health record (e.g., CLINICAL, DIAGNOSTIC, PRESCRIPTION)
   */
  category: string;
  
  /**
   * The health information types included in this record
   */
  hiTypes: string[];
  
  /**
   * The actual content of the health record
   */
  content: any;
  
  /**
   * Any additional metadata
   */
  metadata?: Record<string, any>;
}

export interface ABHAProfileResponse extends APIResponse<M2ABHAProfileData> {}

export interface M2ABHAProfileData {
  /**
   * The ABHA number (14-digit number)
   */
  abhaNumber: string;
  
  /**
   * The ABHA address (username@abdm)
   */
  abhaAddress: string;
  
  /**
   * The full name of the ABHA holder
   */
  name: string;
  
  /**
   * The gender (M/F/O)
   */
  gender: string;
  
  /**
   * The date of birth in ISO 8601 format (YYYY-MM-DD)
   */
  dateOfBirth: string;
  
  /**
   * The mobile number linked to the ABHA
   */
  mobile: string;
  
  /**
   * The email linked to the ABHA (if any)
   */
  email?: string;
  
  /**
   * The address details
   */
  address?: {
    addressLine1: string;
    addressLine2?: string;
    district: string;
    state: string;
    pincode: string;
    country: string;
  };
  
  /**
   * The authentication methods enabled for this ABHA
   */
  authMethods: string[];
  
  /**
   * The list of linked health records (if any)
   */
  healthRecords?: Array<{
    id: string;
    type: string;
    title: string;
    date: string;
    provider: {
      id: string;
      name: string;
    };
  }>;
  
  /**
   * The timestamp when the ABHA was created
   */
  createdAt: string;
  
  /**
   * The timestamp when the ABHA was last updated
   */
  updatedAt: string;
}

export interface FetchRecordsOptions {
  /**
   * The start date for filtering records (ISO 8601 format)
   */
  fromDate?: string;
  
  /**
   * The end date for filtering records (ISO 8601 format)
   */
  toDate?: string;
  
  /**
   * The health information types to filter by
   */
  hiTypes?: string[];
  
  /**
   * The category to filter by (e.g., CLINICAL, DIAGNOSTIC, PRESCRIPTION)
   */
  category?: string;
  
  /**
   * The type of health record to filter by
   */
  type?: string;
  
  /**
   * The maximum number of records to return per page
   */
  limit?: number;
  
  /**
   * The offset for pagination
   */
  offset?: number;
}
