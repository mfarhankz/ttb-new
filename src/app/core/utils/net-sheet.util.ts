import { NetSheetTabId } from '../interfaces/net-sheet.interface';

export function netSheetToFixed(value: unknown, decimals = 2): number {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }

  return Number(num.toFixed(decimals));
}

export function netSheetSum(values: unknown[]): number {
  let sum = 0;
  for (const value of values) {
    sum += Number(value) || 0;
  }

  return netSheetToFixed(sum);
}

export function netSheetPercentOfSale(percent: unknown, salesPrice: number): number {
  return netSheetToFixed((Number(percent) || 0) * (salesPrice / 100));
}

export function netSheetValueToPercent(value: unknown, salesPrice: number, decimals = 4): number {
  if (!salesPrice) {
    return 0;
  }

  return netSheetToFixed(((Number(value) || 0) * 100) / salesPrice, decimals);
}

export function formatNetSheetDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

export function toInputDateValue(value: unknown): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromInputDateValue(value: string): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function shouldSkipSubtotalField(fieldName: string): boolean {
  const lower = fieldName.toLowerCase();
  return lower.includes('rate') || lower.includes('payer');
}

export function isMockBlankPropertyId(propertyId?: string): boolean {
  return !!propertyId && propertyId.toLowerCase().includes('mock');
}

export function mapNetsheetTypeToTab(type: string | undefined): NetSheetTabId {
  const normalized = (type ?? '').toLowerCase();
  if (normalized.includes('buyer')) {
    return 'buyer';
  }
  if (normalized.includes('refinance')) {
    return 'refinance';
  }
  if (normalized.includes('net') && normalized.includes('sell')) {
    return 'net2sell';
  }
  if (normalized.includes('seller')) {
    return 'seller';
  }

  return 'seller';
}
