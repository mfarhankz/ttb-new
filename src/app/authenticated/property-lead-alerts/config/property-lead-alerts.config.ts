import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
import { PlaSaveQueryRequest } from '@app/authenticated/property-lead-alerts/interfaces/property-lead-alerts.interface';
export const PLA_RADIUS_MILES = '5';
export const PLA_COUNT_MAX_LIMIT = 30_000;
export const PLA_SUBSCRIPTION_PLAN = '8';
export const PLA_SUBSCRIPTION_PRICE = 30;
export const PLA_USE_CODES = ['RSFR', 'RCON', 'RTRW', 'RNEC'] as const;

export const PLA_PROPERTY_TYPES_LABEL = 'SFR, Condo, Townhouse, NEC';
export const PLA_LEAD_TYPES_LABEL = 'All lead types available for the area';

export function buildDefaultPlaSearchName(): string {
  const date = new Date().toLocaleDateString('en-US');
  return `Property Lead Alert for a saved query created on ${date}`;
}

export function buildPlaQueryPayload(
  stateFips: string,
  centerLat: string,
  centerLng: string
): AreaSearchPayload {
  return {
    searchOptions: {
      omit_saved_records: false,
      max_limit: PLA_COUNT_MAX_LIMIT
    },
    customFilters: {},
    geometry: {
      match: 'circle',
      value: {
        center_lat: centerLat,
        center_lng: centerLng,
        radius: PLA_RADIUS_MILES
      }
    },
    mm_fips_state_code: stateFips,
    use_code_std: [...PLA_USE_CODES]
  };
}

export function buildPlaSavePayload(
  name: string,
  propertyCount: number,
  query: AreaSearchPayload
): PlaSaveQueryRequest {
  return {
    property_count: propertyCount,
    alm_dns_support: true,
    name,
    is_to_update: false,
    direct_share: false,
    query
  };
}
