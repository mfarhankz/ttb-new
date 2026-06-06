/**
 * API Configuration
 * Centralized configuration for API endpoints
 */

// Development flags for easier testing
export const SKIP_LOGIN_IN_DEV = false; // Set to true to auto-login with default credentials
export const SKIP_PHONE_REGISTER_IN_DEV = false; // Set to true to auto-register phone with default number
export const DISABLE_MFA_IN_DEV = false; // Set to false to enable MFA

export const API_CONFIG = {
  /** Fallback before VerticalService.init(); runtime uses vertical_api_url */
  baseUrl: 'https://demo.api.titletoolbox.com/webservices',
  storageBaseUrl: 'https://demo.api.titletoolbox.com',
  userPicLocation: 'ttb-storage/demo/user_pic',
  endpoints: {
    login: '/login.json',
    sendMfaOtp: '/send_mfa_otp.json',
    verifyMfaOtp: '/verify_mfa_otp.json',
    getUserWallet: '/get_user_wallet.json',
    showBillingProfile: '/show_billing_profile.json',
    cancelSubscription: '/cancel_subscription.json',
    listSubscriptionOptions: '/list_subscription_options.json',
    getUserSettings: '/get_user_settings.json',
    saveUserSettings: '/save_user_settings.json',
    showPurchaseHistory: '/show_purchase_history.json',
    userUsageReport: '/usage_report'
  }
} as const;

