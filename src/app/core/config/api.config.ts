/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Development flags for easier testing
export const SKIP_LOGIN_IN_DEV = false; // Set to true to auto-login with default credentials
export const SKIP_PHONE_REGISTER_IN_DEV = false; // Set to true to auto-register phone with default number
export const DISABLE_MFA_IN_DEV = false; // Set to false to enable MFA

export const API_CONFIG = {
  baseUrl: 'https://demo.api.titletoolbox.com/webservices',
  endpoints: {
    login: '/login.json',
    sendMfaOtp: '/send_mfa_otp.json',
    verifyMfaOtp: '/verify_mfa_otp.json'
  }
} as const;

