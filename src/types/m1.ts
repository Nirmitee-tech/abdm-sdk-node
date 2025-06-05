/**
 * Types for M1 module (ABHA Enrollment and Management)
 */

// --- Session Management --- 
export interface SessionRequest {
  clientId: string;
  clientSecret: string;
  grantType: 'client_credentials';
}

export interface SessionResponse {
  accessToken: string;
  expiresIn: number; // in seconds
  refreshToken?: string;
  refreshExpiresIn?: number; // in seconds
  tokenType: string; // e.g., "Bearer"
}

// --- Aadhaar Based ABHA Enrollment --- 

// Note: Original OTPSendRequest is commented out as m1.service.ts expects AadhaarSendOTPRequest.
// Review if OTPSendRequest is used elsewhere or can be removed.
/*
export interface OTPSendRequest {
  aadhaar: string; // Unencrypted Aadhaar
  purpose?: string;
}
*/

export interface AadhaarSendOTPRequest {
  scope: Array<'abha-enrol' | string>; // 'abha-enrol' is common
  loginHint: 'aadhaar' | 'mobile'; // Specifies the type of loginId
  loginId: string; // Encrypted Aadhaar number or mobile number
  otpSystem: 'aadhaar' | 'adhaar'; // System to generate OTP from, confirm exact value from spec (e.g. 'aadhaar')
}

export interface AadhaarSendOTPResponse {
  txnId: string;
  message?: string; // Optional message from the server
}

export interface AadhaarVerifyAndCreateABHARequest {
  authData: {
    authMethods: Array<'otp' | 'demographics' | 'password' | string>;
    otp?: {
      txnId: string;
      otpValue: string; // Encrypted OTP if required by API, else plaintext
    };
    // Placeholder for other auth methods like demographics data
    // demographics?: { ... }; 
  };
  creationType: 'abha-id' | 'abha-address'; // Specifies what is being created
  preferredAbhaAddress?: string; // Optional: if creating/claiming an ABHA address
}

// Generic OTP verification request, can be used for Mobile OTP, etc.
export interface OTPVerifyRequest {
  otp: string; // Encrypted OTP if required by API, else plaintext
  txnId: string;
}

// --- ABHA Profile and Account Data ---
export interface ABHAProfileData {
  abhaNumber: string; // ABHA Number (14 digits)
  abhaAddress?: string; // Preferred ABHA Address (username@abdm)
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string; // Full name as registered
  gender?: 'M' | 'F' | 'O' | 'U'; // Male, Female, Other, Undisclosed
  dob?: string; // Date of birth, format YYYY-MM-DD or DD-MM-YYYY (confirm spec)
  dayOfBirth?: string;
  monthOfBirth?: string;
  yearOfBirth?: string;
  mobile?: string; // Registered mobile number
  email?: string; // Registered email address
  profilePhoto?: string; // Base64 encoded image string or a URL
  address?: string; // Physical address
  stateCode?: string;
  stateName?: string;
  districtCode?: string;
  districtName?: string;
  subDistrictCode?: string;
  villageCode?: string;
  townCode?: string;
  wardCode?: string;
  pincode?: string;
  kycVerified?: boolean;
  kycPhoto?: string; // Photo from KYC document
  tags?: Record<string, any>; // Additional tags or metadata
  [key: string]: any; // Allow for other properties returned by API
}

// Response after successful ABHA ID/Account creation (typically via Aadhaar OTP verification)
export interface ABHACreationResponse {
  txnId: string;
  token?: string; // User session token for subsequent profile-related API calls
  refreshToken?: string;
  expiresIn?: number; // Expiry for the token, in seconds
  profile: ABHAProfileData; // Detailed profile information of the user
  isNewUser?: boolean; // Flag indicating if this is a newly created ABHA account
  authMethods?: string[]; // List of authentication methods set up or available
  message?: string; // Optional success message
}

// Request type for the older/alternate createABHAWithAadhaar flow (if still used)
// This was the original ABHACreationRequest in the file.
export interface LegacyABHACreationRequest extends OTPVerifyRequest {
  authMethod?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: 'M' | 'F' | 'O';
  dob?: string; // Format YYYY-MM-DD or DD-MM-YYYY
  mobile?: string;
  email?: string;
  // This request might also include preferredAbhaAddress
}

// --- ABHA Address Management ---
export interface ABHAAddressSuggestion {
  abhaAddress: string;
  preferred?: boolean;
}

export interface ABHAAddressResponse {
  suggestions: ABHAAddressSuggestion[]; // List of suggested ABHA addresses
  message?: string;
}

export interface ABHAAddressRequest {
  abhaAddress: string; // The ABHA address to be created/claimed
  preferred?: boolean; // Mark as preferred ABHA address
  txnId: string; // Transaction ID from a preceding step (e.g., account creation)
}

// --- Mobile and Email Operations ---
export interface MobileUpdateRequest {
  mobile: string;
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
export interface UpdateABHAProfileRequest extends Partial<Pick<ABHAProfileData,
  'firstName' |
  'middleName' |
  'lastName' |
  'gender' |
  'dob' |
  'yearOfBirth' |
  'monthOfBirth' |
  'dayOfBirth' |
  'mobile' |
  'email' |
  'profilePhoto' |
  'address' |
  'stateCode' |
  'districtCode' |
  'pincode'
  // Add other updatable fields as per API specification
>> {
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
