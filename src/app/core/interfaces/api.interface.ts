/**
 * API Request/Response Interfaces
 */

export interface TbUser {
  username: string;
  password: string;
}

export interface LoginRequest {
  TbUser: TbUser;
}

// Internal interface for component usage
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  status?: string;
  message?: string;
  data?: {
    token?: string;
    user?: {
      id?: string;
      email?: string;
      name?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  token?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// MFA Interfaces
export interface RegisterPhoneMFARequest {
  phone: string;
}

export interface VerifyOTPRequest {
  otp: string;
  remember_me?: boolean;
}

export interface MFAResponse {
  status: string;
  message?: string;
  data?: any;
}

