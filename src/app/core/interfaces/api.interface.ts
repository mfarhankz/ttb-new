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

export interface WalletInfo {
  wallet_balance?: number | string;
  modified?: string;
}

export interface TtbWalletResponse {
  response: {
    status: string;
    message?: string;
    count?: number;
    data: WalletInfo | WalletInfo[] | string[];
  };
}

export interface SubscribedService {
  service_name?: string;
  [key: string]: unknown;
}

export interface BillingProfile {
  profile_id?: string;
  profile_start_date?: string;
  next_bill_date?: string;
  last_payment_date?: string;
  last_payment_amount?: number | string;
  status?: string;
  plan?: string;
  card_type?: string;
  exp_date?: string;
  deny_access_date?: string;
  access_allowed_until?: string;
  subscribed_service?: SubscribedService;
  subscribed_services?: SubscribedService[];
}

export interface TtbBillingProfileResponse {
  response: {
    status: string;
    message?: string;
    count?: number;
    data: BillingProfile[] | Record<string, BillingProfile>;
  };
}

export interface TtbSubscriptionOptionsResponse {
  response: {
    status: string;
    message?: string;
    data?: Record<string, string> | string[];
  };
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

