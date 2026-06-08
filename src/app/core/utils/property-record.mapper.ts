import { resolveDetailPropertyRowActions } from '../config/detail-property-actions.config';
import { PropertyRecordRaw } from '../interfaces/property-record.interface';

export interface LeadDetailItem {
  key: string;
  value: unknown;
}

export interface LeadsMeta {
  leadsTypes: string[];
  leadsAttr: Record<string, string[]>;
}

/** Legacy queryToolFactory.getLeadsHashMap() labels (common lead prefixes). */
const LEAD_TYPE_LABELS: Record<string, string> = {
  HO: 'HOA Lien'
};

function capitalize(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }

  const text = String(value).trim();
  if (!text) {
    return '';
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function formatCurrency(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) {
    return value != null && value !== '' ? String(value) : '';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(num);
}

function formatPercent(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    return '';
  }

  return `${num}%`;
}

function getSoldIn(dateString?: string): string {
  if (!dateString || dateString === '0000-00-00') {
    return '';
  }

  let normalized = dateString;
  if (normalized.substring(4, 10) === '-00-00') {
    normalized = `${normalized.substring(0, 4)}-01-01`;
  } else if (normalized.substring(7, 10) === '-00') {
    normalized = `${normalized.substring(0, 7)}-01`;
  }

  const year = normalized.substring(0, 4);
  return /^\d{4}$/.test(year) ? year : '';
}

function resolveCustomPhone(record: PropertyRecordRaw): string {
  if (record['customPhone']) {
    return String(record['customPhone']);
  }

  if (record.phone) {
    return String(record.phone);
  }

  const multiple = record.phone_multiple;
  if (multiple && typeof multiple === 'object' && !Array.isArray(multiple)) {
    const phone = (multiple as Record<string, unknown>)['Phone'];
    if (phone != null && phone !== '') {
      return String(phone);
    }
  }

  return '';
}

/** Legacy parsePropertyModel lead key transform — `HO.file_date` → `file date`. */
function transformLeadDisplayKey(key: string, leadPrefix: string): string {
  let normalized = key;
  if (normalized.startsWith(`${leadPrefix}.`)) {
    normalized = normalized.slice(leadPrefix.length + 1);
  }

  return normalized.replace(/_/g, ' ');
}

export function extractLeadsMeta(records: PropertyRecordRaw[]): LeadsMeta {
  const leadsTypes: string[] = [];
  const leadsAttr: Record<string, string[]> = {};
  const first = records[0];

  if (!first) {
    return { leadsTypes, leadsAttr };
  }

  for (const key of Object.keys(first)) {
    const dotIndex = key.indexOf('.');
    if (dotIndex <= 0) {
      continue;
    }

    const leadName = key.slice(0, dotIndex);
    if (!leadsTypes.includes(leadName)) {
      leadsTypes.push(leadName);
      leadsAttr[leadName] = [];
    }

    if (!leadsAttr[leadName].includes(key)) {
      leadsAttr[leadName].push(key);
    }
  }

  return { leadsTypes, leadsAttr };
}

function parseLeadFields(
  record: PropertyRecordRaw,
  leadsAttr: Record<string, string[]>
): {
  leadGroups: Record<string, LeadDetailItem[]>;
  flattened: Record<string, unknown>;
} {
  const leadGroups: Record<string, LeadDetailItem[]> = {};
  const flattened: Record<string, unknown> = {};

  for (const [leadName, props] of Object.entries(leadsAttr)) {
    const items = props.map((prop) => ({
      key: transformLeadDisplayKey(prop, leadName),
      value: record[prop]
    }));

    if (items.length) {
      leadGroups[leadName] = items;
    }

    for (const prop of props) {
      const suffix = prop.slice(prop.indexOf('.') + 1);
      const value = record[prop];
      if (value !== undefined && value !== null && value !== '') {
        flattened[suffix] = value;
      }
    }
  }

  return { leadGroups, flattened };
}

function applyLeadTypeLabels(leadGroups: Record<string, LeadDetailItem[]>, leadsTypes: string[]): void {
  for (const prefix of leadsTypes) {
    const items = leadGroups[prefix];
    if (!items?.length) {
      continue;
    }

    const label = LEAD_TYPE_LABELS[prefix] ?? prefix;
    items[0].value = `${label} (${prefix})`;
  }
}

export function mapPropertyRecord(
  record: PropertyRecordRaw,
  index: number,
  leadsAttr: Record<string, string[]> = {},
  leadsTypes: string[] = []
): Record<string, unknown> {
  const house = record.sa_site_house_nbr ?? '';
  const street = capitalize(record.sa_site_street_name);
  const customAddress = `${house} ${street}`.trim() || '—';
  const customCity = capitalize(record.sa_site_city);
  const customTract = capitalize(record.v_tract ?? record.sa_subdivision);
  const customSoldIn = getSoldIn(record.sa_date_transfer);
  const customPrice = formatCurrency(record.sa_val_transfer);
  const customOccupiedBy = record.sa_site_mail_same === 'Y' ? 'Owner' : 'Non Owner';
  const sellScoreDisplay = formatPercent(record.sell_score);
  const refiScoreDisplay = formatPercent(record.refi_score);
  const customPhone = resolveCustomPhone(record);

  const saX = Number(record.sa_x_coord);
  const saY = Number(record.sa_y_coord);

  const propertyId = record.sa_property_id ?? index + 1;
  const { leadGroups, flattened } = parseLeadFields(record, leadsAttr);
  applyLeadTypeLabels(leadGroups, leadsTypes);

  const searchableByField: Record<string, string> = {
    customAddress: customAddress.toLowerCase(),
    customCity: customCity.toLowerCase(),
    sa_site_zip: String(record.sa_site_zip ?? '').toLowerCase(),
    formatted_sa_owner_1: String(record.formatted_sa_owner_1 ?? '').toLowerCase(),
    sa_parcel_nbr_primary: String(record.sa_parcel_nbr_primary ?? '').toLowerCase(),
    customTract: customTract.toLowerCase(),
    use_code_std: String(record.use_code_std ?? '').toLowerCase(),
    customPhone: customPhone.toLowerCase(),
    emailaddr: String(record.emailaddr ?? '').toLowerCase()
  };

  for (const [suffix, value] of Object.entries(flattened)) {
    searchableByField[suffix] = String(value).toLowerCase();
  }

  return {
    ...record,
    ...flattened,
    ...leadGroups,
    id: String(propertyId),
    propertyId,
    sa_property_id: record.sa_property_id ?? propertyId,
    serialNumber: index + 1,
    customAddress,
    customCity,
    customTract,
    customSoldIn,
    customPrice,
    customOccupiedBy,
    sell_score_display: sellScoreDisplay,
    refi_score_display: refiScoreDisplay,
    customPhone,
    sa_x_coord: Number.isFinite(saX) ? saX : record.sa_x_coord,
    sa_y_coord: Number.isFinite(saY) ? saY : record.sa_y_coord,
    center_lng: Number.isFinite(saX) ? saX : undefined,
    center_lat: Number.isFinite(saY) ? saY : undefined,
    searchableByField,
    actions: resolveDetailPropertyRowActions()
  };
}

export function mapPropertyRecords(
  records: PropertyRecordRaw[],
  leadsAttr: Record<string, string[]> = {},
  leadsTypes: string[] = []
): Record<string, unknown>[] {
  return records.map((record, index) => mapPropertyRecord(record, index, leadsAttr, leadsTypes));
}

export function resolveLeadTypeLabel(prefix: string): string {
  return LEAD_TYPE_LABELS[prefix] ?? prefix;
}
