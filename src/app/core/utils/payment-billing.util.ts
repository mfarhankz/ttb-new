import {
  CARD_TYPE_PATTERNS,
  CardBillingFormValue,
  TbBillingPayload
} from '../interfaces/payment.interface';

export interface BillingAddressSource {
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export function normalizeCardNumber(value: string): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function getCardNumberMaxDigits(digits: string): number {
  return /^(34|37)/.test(digits) ? 15 : 16;
}

/** Digits only, grouped as XXXX XXXX XXXX XXXX (Amex: XXXX XXXXXX XXXXX). */
export function formatCardNumberInput(raw: string): string {
  let digits = normalizeCardNumber(raw);
  digits = digits.slice(0, getCardNumberMaxDigits(digits));

  if (/^(34|37)/.test(digits)) {
    return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10)]
      .filter((part, index) => index === 0 || part.length > 0)
      .join(' ');
  }

  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function blockCardNumberKeydown(event: KeyboardEvent, rawValue: string): void {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    NUMERIC_INPUT_ALLOWED_KEYS.has(event.key)
  ) {
    return;
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
    return;
  }

  const input = event.target as HTMLInputElement | null;
  const value = input?.value ?? rawValue;
  const selectedLength =
    input?.selectionStart != null && input.selectionEnd != null
      ? Math.max(0, input.selectionEnd - input.selectionStart)
      : 0;
  const digits = normalizeCardNumber(value);
  const maxDigits = getCardNumberMaxDigits(digits);

  if (digits.length - selectedLength >= maxDigits) {
    event.preventDefault();
  }
}

export function isValidCardNumber(value: string): boolean {
  const digits = normalizeCardNumber(value);
  const cardType = detectCardType(digits);

  if (!cardType) {
    return false;
  }

  const expectedLength = cardType === 'Amex' ? 15 : 16;
  return digits.length === expectedLength;
}

export function detectCardType(cardNumber: string): string {
  const normalized = normalizeCardNumber(cardNumber);

  for (const cardType of CARD_TYPE_PATTERNS) {
    if (cardType.pattern.test(normalized)) {
      return cardType.title;
    }
  }

  return '';
}

const NUMERIC_INPUT_ALLOWED_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End'
]);

/** Blocks letter/symbol keypresses; paste is still sanitized by format helpers. */
export function blockNonDigitKeydown(event: KeyboardEvent): void {
  if (
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    NUMERIC_INPUT_ALLOWED_KEYS.has(event.key)
  ) {
    return;
  }

  if (!/^\d$/.test(event.key)) {
    event.preventDefault();
  }
}

/** Digits only, max 4 characters (Amex); other brands validate to 3 on submit. */
export function formatSecurityCodeInput(raw: string): string {
  return String(raw ?? '').replace(/\D/g, '').slice(0, 4);
}

export function isValidSecurityCode(code: string, cardType: string): boolean {
  const digits = String(code ?? '').trim();
  if (!/^\d+$/.test(digits)) {
    return false;
  }

  return cardType === 'Amex' ? digits.length === 4 : digits.length === 3;
}

/** Digits only, auto-formats as MM/YYYY, max 7 characters. */
export function formatCardExpiryInput(raw: string): string {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 6);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function parseCardExpiry(expiry: string): { expMonth: string; expYear: string } | null {
  const parts = String(expiry ?? '')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  return {
    expMonth: parts[0],
    expYear: parts[1]
  };
}

export function buildTbBillingFromForm(
  form: CardBillingFormValue,
  userId: number | string | null | undefined,
  accountAddress?: BillingAddressSource
): TbBillingPayload {
  const expiry = parseCardExpiry(form.expiry);
  const useAccountAddress = form.billingAddressIsSame && accountAddress;

  return {
    number: normalizeCardNumber(form.number),
    card_type: detectCardType(form.number),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    exp_month: expiry?.expMonth ?? null,
    exp_year: expiry?.expYear ?? null,
    security_code: form.securityCode.trim(),
    amount: form.amount,
    promo_code: null,
    user_id: userId ?? null,
    address: useAccountAddress ? accountAddress?.address ?? null : form.address.trim() || null,
    addres2: useAccountAddress
      ? accountAddress?.address_2 ?? null
      : form.address2.trim() || null,
    city: useAccountAddress ? accountAddress?.city ?? null : form.city.trim() || null,
    state: useAccountAddress ? accountAddress?.state ?? null : form.state.trim() || null,
    zip: useAccountAddress ? accountAddress?.zip ?? null : form.zip.trim() || null,
    phone: form.phone.trim(),
    email: form.email.trim()
  };
}

export function computeExtraCreditAmount(
  amount: number | null | undefined,
  appConfig: Record<string, unknown> | undefined
): number {
  const purchaseAmount = Number(amount);
  if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0 || !appConfig) {
    return 0;
  }

  const campaign = appConfig['promo_credit_campaign'] as
    | { promo_credit_schedule?: Array<{ min?: number; extra_credit?: number }> }
    | undefined;
  const schedule = campaign?.promo_credit_schedule;
  if (!Array.isArray(schedule)) {
    return 0;
  }

  let extra = 0;
  for (const entry of schedule) {
    const min = Number(entry?.min);
    const extraCredit = Number(entry?.extra_credit);
    if (Number.isFinite(min) && purchaseAmount >= min && Number.isFinite(extraCredit)) {
      extra = extraCredit;
    }
  }

  return extra;
}
