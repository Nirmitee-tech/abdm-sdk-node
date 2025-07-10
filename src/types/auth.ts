

export interface GenerateOtpRequest {
  /**
   * The mobile number or ABHA address to send OTP to
   */
  mobileNumber?: string;
  abhaAddress?: string;
  
  /**
   * The transaction ID for this request
   */
  txnId?: string;
  
  /**
   * The type of OTP (MOBILE_OTP, AADHAAR_OTP, etc.)
   */
  authMethod?: string;
}

export interface GenerateOtpResponse {
  /**
   * The transaction ID for this OTP request
   */
  txnId: string;
  
  /**
   * The masked mobile number or ABHA address where OTP was sent
   */
  maskedMobileNumber?: string;
  maskedAbhaAddress?: string;
}

export interface GenerateAadhaarOtpRequest {
  /**
   * The Aadhaar number to generate OTP for
   */
  aadhaarNumber: string;
  
  /**
   * The transaction ID for this request
   */
  txnId?: string;
}

export interface AadhaarOtpResponse {
  /**
   * The transaction ID for this OTP request
   */
  txnId: string;
  
  /**
   * The message indicating OTP was sent
   */
  message: string;
}

export interface VerifyAadhaarOtpRequest {
  /**
   * The transaction ID from the OTP generation step
   */
  txnId: string;
  
  /**
   * The OTP value received by the user
   */
  otpValue: string;
  
  /**
   * The Aadhaar number (optional, for additional verification)
   */
  aadhaarNumber?: string;

  /**
   * The mobile number for ABHA communication (optional)
   */
  mobile?: string;
}

export interface VerifyAadhaarOtpResponse {
  /**
   * The transaction ID for this OTP verification
   */
  txnId: string;
  
  /**
   * The message indicating OTP verification result
   */
  message: string;
  
  /**
   * Whether the OTP verification was successful
   */
  isSuccess: boolean;
}

export interface CreateAbhaRequest {
  /**
   * The transaction ID from the OTP generation step
   */
  txnId: string;
  
  /**
   * The OTP received by the user
   */
  otp: string;
  
  /**
   * The Aadhaar number (if using Aadhaar-based flow)
   */
  aadhaarNumber?: string;
  
  /**
   * The mobile number (if using mobile-based flow)
   */
  mobileNumber?: string;
  
  /**
   * The full name of the user
   */
  name: string;
  
  /**
   * The date of birth in DD-MM-YYYY format
   */
  dob: string;
  
  /**
   * The gender (M/F/O)
   */
  gender: 'M' | 'F' | 'O';
  
  /**
   * The address details
   */
  address?: {
    addressLine1: string;
    addressLine2?: string;
    district: string;
    state: string;
    pincode: string;
  };
  
  /**
   * The email address (optional)
   */
  email?: string;
  
  /**
   * The profile photo (base64 encoded, optional)
   */
  profilePhoto?: string;
}

export interface CreateAbhaResponse {
  /**
   * The newly created ABHA number
   */
  healthIdNumber: string;
  
  /**
   * The ABHA address (username@abdm)
   */
  healthId: string;
  
  /**
   * The name of the ABHA holder
   */
  name: string;
  
  /**
   * The gender (M/F/O)
   */
  gender: string;
  
  /**
   * The year of birth
   */
  yearOfBirth: string;
  
  /**
   * The mobile number linked to the ABHA
   */
  mobile: string;
  
  /**
   * The email linked to the ABHA (if any)
   */
  email?: string;
  
  /**
   * The authentication methods enabled for this ABHA
   */
  authMethods: string[];
  
  /**
   * The timestamp when the ABHA was created
   */
  createdDate: string;
  
  /**
   * The timestamp when the ABHA was last updated
   */
  updatedDate: string;
}
