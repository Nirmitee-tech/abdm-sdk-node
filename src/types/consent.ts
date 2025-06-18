

export interface ConsentStatusResponse {
  /**
   * The status of the consent request
   */
  status: 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'FAILED';
  
  /**
   * The consent request ID
   */
  requestId: string;
  
  /**
   * The consent artefact ID (if consent was granted)
   */
  consentArtefactId?: string;
  
  /**
   * The consent details (if consent was granted)
   */
  consentDetail?: {
    consentId: string;
    createdAt: string;
    purpose: {
      text: string;
      code: string;
    };
    patient: {
      id: string;
    };
    hiu: {
      id: string;
    };
    hip?: {
      id: string;
    };
    careContexts: Array<{
      patientReference: string;
      careContextReference: string;
    }>;
    hiTypes: string[];
    consentManager: {
      id: string;
    };
    requester: {
      name: string;
      identifier: {
        type: string;
        value: string;
        system: string;
      };
    };
    consentStart: string;
    consentEnd: string;
    consentExpiry: string;
  };
  
  /**
   * Error details if the request failed
   */
  error?: {
    code: number;
    message: string;
  };
}

export interface HealthInformationRequest {
  /**
   * The consent artefact ID obtained from the consent request
   */
  consentId: string;
  
  /**
   * The date from which to fetch health information (ISO 8601 format)
   */
  dateRange: {
    from: string;
    to: string;
  };
  
  /**
   * The data push URL where the health information will be sent
   */
  dataPushUrl: string;
  
  /**
   * The key material for encrypting the health information
   */
  keyMaterial: {
    cryptoAlg: 'ECDH' | 'RSA';
    curve: 'Curve25519' | 'P-256' | 'P-384' | 'P-521';
    dhPublicKey: {
      expiry: string;
      parameters: 'Curve25519' | 'P-256' | 'P-384' | 'P-521';
      keyValue: string;
    };
    nonce: string;
  };
  
  /**
   * Additional context for the health information request
   */
  context?: Record<string, any>;
}

export interface HealthInformationResponse {
  /**
   * The status of the health information request
   */
  status: 'REQUESTED' | 'SUCCESS' | 'ERROR' | 'FAILED';
  
  /**
   * The health information request ID
   */
  requestId: string;
  
  /**
   * The transaction ID for this request
   */
  transactionId: string;
  
  /**
   * The consent artefact ID
   */
  consentId: string;
  
  /**
   * The date range for the health information
   */
  dateRange: {
    from: string;
    to: string;
  };
  
  /**
   * The data push URL where the health information will be sent
   */
  dataPushUrl: string;
  
  /**
   * The key material for decrypting the health information
   */
  keyMaterial: {
    cryptoAlg: 'ECDH' | 'RSA';
    curve: 'Curve25519' | 'P-256' | 'P-384' | 'P-521';
    dhPublicKey: {
      expiry: string;
      parameters: 'Curve25519' | 'P-256' | 'P-384' | 'P-521';
      keyValue: string;
    };
    nonce: string;
  };
  
  /**
   * The health information entries (if status is SUCCESS)
   */
  entries?: Array<{
    content: any;
    checksum: string;
    careContextReference: string;
    hiType: string;
    date: string;
  }>;
  
  /**
   * Error details if the request failed
   */
  error?: {
    code: number;
    message: string;
  };
}

export interface BridgeServiceRegistrationRequest {
  /**
   * The name of the bridge service
   */
  name: string;
  
  /**
   * The type of bridge service
   */
  type: 'HIU' | 'HIP' | 'HEALTH_LOCKER' | 'HEALTH_REPOSITORY' | 'HEALTH_INFORMATION_EXCHANGE';
  
  /**
   * The URL of the bridge service
   */
  url: string;
  
  /**
   * The supported FHIR version
   */
  fhirVersion: 'STU3' | 'R4' | 'R5';
  
  /**
   * The supported FHIR resources
   */
  supportedResources: string[];
  
  /**
   * The supported FHIR operations
   */
  supportedOperations: string[];
  
  /**
   * The authentication details
   */
  authentication: {
    authType: 'OAUTH2' | 'JWT' | 'NONE';
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
  };
  
  /**
   * The contact information for the bridge service
   */
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

export interface BridgeServiceResponse {
  /**
   * The ID of the bridge service
   */
  id: string;
  
  /**
   * The name of the bridge service
   */
  name: string;
  
  /**
   * The type of bridge service
   */
  type: string;
  
  /**
   * The URL of the bridge service
   */
  url: string;
  
  /**
   * The status of the bridge service
   */
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  
  /**
   * The timestamp when the bridge service was created
   */
  createdAt: string;
  
  /**
   * The timestamp when the bridge service was last updated
   */
  updatedAt: string;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

export interface BridgeServicesResponse {
  /**
   * The list of bridge services
   */
  services: BridgeServiceResponse[];
  
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
