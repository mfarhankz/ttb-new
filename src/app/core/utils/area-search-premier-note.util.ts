import { VerticalAppConfig } from '../interfaces/vertical.interface';

export interface AreaSearchPremierPriceRow {
  label: string;
  price: string;
}

export interface AreaSearchPremierNote {
  groupId: 4 | 7;
  mortgageCents?: number;
  leadsMinCents?: number;
  leadsMaxCents?: number;
  priceRows?: AreaSearchPremierPriceRow[];
  sampleImageSrc: string;
  sampleImageTitle: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function readPricePerRec(appConfig: VerticalAppConfig | undefined): Record<string, unknown> | null {
  const pricing = appConfig?.['price_per_rec'];
  return pricing && typeof pricing === 'object' ? (pricing as Record<string, unknown>) : null;
}

export function buildAreaSearchPremierNote(
  groupId: number,
  appConfig: VerticalAppConfig | undefined,
  leadsChoices: Record<string, string> | null | undefined
): AreaSearchPremierNote | null {
  const normalizedGroupId = Number(groupId);
  const pricing = readPricePerRec(appConfig);

  if (normalizedGroupId === 4) {
    const equity = pricing ? Number(pricing['equity']) : 0.08;
    const cents = Number.isFinite(equity) ? equity * 100 : 8;

    return {
      groupId: 4,
      mortgageCents: cents,
      sampleImageSrc: 'assets/images/mortgage.png',
      sampleImageTitle: 'Mortgage info Export Sample Fields'
    };
  }

  if (normalizedGroupId === 7) {
    if (!pricing) {
      return null;
    }

    const leadsPricing = pricing['leads'];
    if (!leadsPricing || typeof leadsPricing !== 'object') {
      return null;
    }

    const entries = Object.entries(leadsPricing as Record<string, unknown>).filter(([, price]) =>
      Number.isFinite(Number(price))
    );

    if (!entries.length) {
      return null;
    }

    const numericPrices = entries.map(([, price]) => Number(price));
    const priceRows = entries.map(([leadType, price]) => ({
      label: leadsChoices?.[leadType] ?? leadType,
      price: formatCurrency(Number(price))
    }));

    return {
      groupId: 7,
      leadsMinCents: Math.min(...numericPrices) * 100,
      leadsMaxCents: Math.max(...numericPrices) * 100,
      priceRows,
      sampleImageSrc: 'assets/images/leads_types.png',
      sampleImageTitle: 'Lead Type Export Sample Fields'
    };
  }

  return null;
}
