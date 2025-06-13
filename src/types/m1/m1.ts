import type { APIResponse } from '../common';

export interface SessionRequest extends APIResponse<{
  // Add session request properties here
}> {}

export interface GenerateOtpRequest extends APIResponse<{
  // Add generate OTP request properties here
}> {}

export interface GenerateOtpResponse extends APIResponse<{
  // Add generate OTP response properties here
}> {}

export interface CreateAbhaRequest extends APIResponse<{
  // Add create ABHA request properties here
}> {}

export interface CreateAbhaResponse extends APIResponse<{
  // Add create ABHA response properties here
}> {}
