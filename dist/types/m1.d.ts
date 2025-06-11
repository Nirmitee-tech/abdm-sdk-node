export interface SessionRequest {
    clientId: string;
    clientSecret: string;
    grantType: 'client_credentials';
}
export interface SessionResponse {
    accessToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
    refreshToken: string;
    tokenType: string;
    'not-before-policy': number;
    session_state: string;
    scope: string;
}
export interface GenerateOtpRequest {
    loginId: string;
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
            otpValue: string;
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
export interface EmailVerificationRequest {
    email: string;
}
export interface UpdateABHAProfileRequest extends Partial<Pick<ABHAProfileData, 'firstName' | 'middleName' | 'lastName' | 'gender' | 'dob' | 'yearOfBirth' | 'monthOfBirth' | 'dayOfBirth' | 'mobile' | 'email' | 'profilePhoto' | 'address' | 'stateCode' | 'districtCode' | 'pincode'>> {
    txnId?: string;
}
export interface ABHACardResponse {
    card: string;
    message?: string;
}
export interface CheckABHAAddressExistsRequest {
    phrAddress: string;
}
export interface CheckABHAAddressExistsResponse {
    exists: boolean;
    message?: string;
}
export interface MessageResponse {
    message: string;
    status?: string;
    code?: string;
}
//# sourceMappingURL=m1.d.ts.map