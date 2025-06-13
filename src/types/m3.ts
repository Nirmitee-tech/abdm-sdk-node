export interface M3SessionRequest {
  clientId: string;
  clientSecret: string;
  grantType: string;
}

export interface M3SessionResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  // Optional since client credentials flow doesn't return a refresh token
  refreshToken?: string;
}

export interface BridgeServiceRegistrationRequest {
  id: string;
  name: string;
  types: string[];
  endpoints: {
    hipEndpoints?: Endpoint[];
    hiuEndpoints?: Endpoint[];
    healthLockerEndpoints?: Endpoint[];
  };
  active: boolean;
}

export interface Endpoint {
  use: string;
  connectionType: string;
  address: string;
}

export interface BridgeServiceResponse {
  id: string;
  name: string;
  types: string[];
  endpoints: {
    hipEndpoints: Endpoint[];
    hiuEndpoints: Endpoint[];
    healthLockerEndpoints: Endpoint[];
  };
  active: boolean;
}

export interface BridgeResponse {
  id: string;
  name: string;
  url: string;
  active: boolean;
  blocklisted: boolean;
}

export interface BridgeServicesResponse {
  bridge: BridgeResponse;
  services: BridgeServiceResponse[];
}

// HIU Consent Types
export interface M3ConsentRequest {
  requestId: string;
  timestamp: string;
  consent: {
    purpose: {
      text: string;
      code: string;
      refUri?: string;
    };
    patient: {
      id: string;
    };
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
        value: string;
        repeats?: number;
      };
    };
  };
}

export interface ConsentStatusResponse {
  requestId: string;
  timestamp: string;
  consentRequest: {
    id: string;
    status: 'REQUESTED' | 'GRANTED' | 'DENIED' | 'EXPIRED' | 'CANCELLED';
    createdAt: string;
    consentArtefacts?: ConsentArtefact[];
  };
}

export interface ConsentArtefact {
  id: string;
  status: 'GRANTED' | 'REVOKED' | 'EXPIRED';
  signature: string;
}

export interface HealthInformationRequest {
  requestId: string;
  timestamp: string;
  hiRequest: {
    consentId: string;
    dateRange: {
      from: string;
      to: string;
    };
    dataPushUrl: string;
    keyMaterial: {
      cryptoAlg: string;
      curve: string;
      dhPublicKey: {
        expiry: string;
        keyValue: string;
        parameters: string;
      };
      nonce: string;
    };
  };
}

export interface HealthInformationResponse {
  requestId: string;
  timestamp: string;
  hiRequest: {
    transactionId: string;
    sessionStatus: 'REQUESTED' | 'ACKNOWLEDGED' | 'ERROR';
  };
}

export interface HealthInformationNotification {
  requestId: string;
  timestamp: string;
  notification: {
    consentId: string;
    doneAt: string;
    notifier: {
      type: 'HIU' | 'HIP';
      id: string;
    };
    statusNotification: {
      sessionStatus: 'TRANSFERRED' | 'FAILED';
      hipId?: string;
      statusResponses?: Array<{
        careContextReference: string;
        hiStatus: 'OK' | 'ERROR';
        description?: string;
      }>;
    };
  };
}
