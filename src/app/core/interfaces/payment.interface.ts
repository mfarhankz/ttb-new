import { SavedFarmRecord } from './saved-farm.interface';
import { WalletInfo } from './api.interface';

export type PayNowMode = 'recsPurchase' | 'creditRecharge' | 'dlaSubscribe';

export type PaymentMethod = 'credit' | 'card';

export interface TbBillingPayload {
  number?: string | null;
  card_type?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  exp_month?: string | null;
  exp_year?: string | null;
  security_code?: string | null;
  plan?: string | null;
  amount?: number | null;
  promo_code?: string | null;
  user_id?: number | string | null;
  address?: string | null;
  addres2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  phone?: string | number | null;
  email?: string | null;
}

export interface PaymentStepPayload {
  TbBilling?: TbBillingPayload;
  action?: 'verify_cc' | 'confirm' | 'cancel';
  payment_method?: 'credit' | 'credit card';
  name?: string;
  email_csv_on_complete?: boolean;
  [key: string]: unknown;
}

export interface BillingConfirmationData {
  number?: string;
  name_on_card?: string;
  security_code?: string;
  exp_month?: string;
  exp_year?: string;
  amount?: number | string;
  product?: string;
  zip?: string;
  farmName?: string;
  estAmount?: boolean;
}

export interface RecsPurchaseSuccessData {
  msg?: string;
  saved_farm?: SavedFarmRecord;
  error?: string;
  user_wallet?: WalletInfo;
  promotional_credit_amount?: number;
}

export interface CreditPurchaseSuccessData {
  msg?: string;
  user_wallet?: WalletInfo;
  promotional_credit_amount?: number;
}

export interface TtbPaymentStepResponse<T = RecsPurchaseSuccessData | CreditPurchaseSuccessData> {
  response: {
    status: string;
    message?: string;
    count?: number;
    data?: T | string | string[];
  };
}

export interface PaymentErrorResult {
  message: string | null;
  messages: string[] | null;
  isWarning: boolean;
}

export interface PayNowOptions {
  mode: PayNowMode;
  priceRequired?: number;
  recordCount?: number;
  enableExcelExport?: boolean;
  contactIncluded?: boolean;
  note?: string;
  noteType?: 'info' | 'warning' | 'success' | 'error';
  /** Subscription plan id — used for PLA (`8`). */
  plan?: string;
  payloadExtend?: Record<string, unknown>;
  onSuccess?: (result: PayNowResult) => void;
}

export interface PayNowResult {
  mode: PayNowMode;
  savedFarm?: SavedFarmRecord;
  wallet?: WalletInfo;
  promotionalCreditAmount?: number;
  message?: string;
}

export interface CardBillingFormValue {
  number: string;
  firstName: string;
  lastName: string;
  expiry: string;
  securityCode: string;
  phone: string;
  email: string;
  amount: number | null;
  billingAddressIsSame: boolean;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

export const CARD_TYPE_PATTERNS: ReadonlyArray<{ title: string; pattern: RegExp }> = [
  { title: 'Visa', pattern: /^4/ },
  { title: 'Amex', pattern: /^(34|37)/ },
  { title: 'MasterCard', pattern: /^5[1-5]/ },
  { title: 'Discover', pattern: /^(6011|65|64[4-9]|622)/ }
];

export const CREDIT_AMOUNT_SUGGESTIONS = [5, 10, 30, 50, 100, 200] as const;
