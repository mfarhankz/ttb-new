import { AreaSearchFieldMeta } from '../interfaces/area-search-field.interface';
import { VerticalAppConfig } from '../interfaces/vertical.interface';

export interface AreaSearchContactPricing {
  phoneCents: number;
  emailCents: number;
  phoneMatchPercent: number;
  emailMatchPercent: number;
  useExtendedDncNote: boolean;
}

/** Legacy RDB contact field — `$` expands to PH + EM for payload and criteria chips. */
export function expandContactInfoValues(
  field: AreaSearchFieldMeta,
  values: string | string[] | null | undefined
): string[] {
  if (values == null || values === '') {
    return [];
  }

  const list = Array.isArray(values) ? values.map(String) : [String(values)];
  if (!list.length || !list.includes('$')) {
    return list;
  }

  const keys = Object.keys(field.choices ?? {}).filter((key) => key !== '$');
  return keys.length ? keys : list.filter((value) => value !== '$');
}

export function readAreaSearchContactPricing(
  appConfig: VerticalAppConfig | undefined
): AreaSearchContactPricing {
  const pricePerRec = appConfig?.['price_per_rec'];
  const contact =
    pricePerRec && typeof pricePerRec === 'object'
      ? ((pricePerRec as Record<string, unknown>)['contact'] as Record<string, unknown> | undefined)
      : undefined;

  const phonePrice = Number(contact?.['PH']);
  const emailPrice = Number(contact?.['EM']);

  return {
    phoneCents: Number.isFinite(phonePrice) ? Math.round(phonePrice * 100) : 7,
    emailCents: Number.isFinite(emailPrice) ? Math.round(emailPrice * 100) : 8,
    phoneMatchPercent: Number(appConfig?.['phone_matching_percentage']) || 75,
    emailMatchPercent: Number(appConfig?.['email_matching_percentage']) || 35,
    useExtendedDncNote: !!appConfig?.['PH_note_extension2']
  };
}
