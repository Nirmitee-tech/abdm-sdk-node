// --- Session Management ---
export interface SessionRequest {
  clientId: string;
  clientSecret: string;
  grantType: 'client_credentials';
}

export interface SessionResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  // Optional fields that might be present in different auth flows
  refreshExpiresIn?: number;
  refreshToken?: string;
  'not-before-policy'?: number;
  session_state?: string;
  scope?: string;
}

// --- Aadhaar Based ABHA Enrollment ---
export interface GenerateOtpRequest {
  loginId: string; // Encrypted Aadhaar
  loginHint: 'aadhaar';
  scope: Array<'abha-enrol'>;
  otpSystem: 'aadhaar';
  txnId: string;
}

export interface GenerateOtpResponse {
  txnId: string;
}

export interface CreateAbhaRequest {
  txnId: string;
  authData: {
    authMethods: Array<'otp'>;
    otp: {
      otpValue: string; // Encrypted OTP
      txnId: string;
    };
  };
  consent: {
    code: string;
    version: string;
  };
}

export interface ABHAProfileData {
  phrAddress: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender: string;
  dob?: string;
  yearOfBirth: string;
  monthOfBirth: string;
  dayOfBirth: string;
  address: string;
  stateName: string;
  stateCode?: string;
  districtName: string;
  districtCode?: string;
  subDistrictName: string;
  villageName: string;
  townName: string;
  wardName: string;
  pincode: string;
  email: string;
  mobile: string;
  authMethods: string[];
  profilePhoto?: string;
}

export interface CreateAbhaResponse extends ABHAProfileData {
  token: string;
  expiresIn: number;
  refreshToken: string;
}

export interface MobileSendOTPResponse {
  txnId: string;
  message?: string;
}

// OTPVerifyRequest can be used for mobile OTP verification

export interface EmailVerificationRequest {
  email: string;
}

// --- Profile Update ---
export interface UpdateABHAProfileRequest
  extends Partial<
    Pick<
      ABHAProfileData,
      | 'firstName'
      | 'middleName'
      | 'lastName'
      | 'gender'
      | 'dob'
      | 'yearOfBirth'
      | 'monthOfBirth'
      | 'dayOfBirth'
      | 'mobile'
      | 'email'
      | 'profilePhoto'
      | 'address'
      | 'stateCode'
      | 'districtCode'
      | 'pincode'
      // Add other updatable fields as per API specification
    >
  > {
  txnId?: string; // May be required for some update operations or implicit via auth token
}

// --- ABHA Card ---
export interface ABHACardResponse {
  card: string; // Base64 encoded card data or URL to the card
  message?: string;
}

// --- ABHA Address Existence Check ---
export interface CheckABHAAddressExistsRequest {
  phrAddress: string; // Changed from abhaAddress to align with common API patterns
}

export interface CheckABHAAddressExistsResponse {
  exists: boolean;
  message?: string;
  // Additional fields might be present in the actual API response
}

// --- Generic Responses ---
export interface MessageResponse {
  message: string;
  status?: string; // e.g., "SUCCESS"
  code?: string; // Optional status code
}
