import { PropertyRecordRaw } from './property-record.interface';

export type PropertySearchTab = 'address' | 'owner' | 'parcel';

export type PropertyAddressType = 'site_address' | 'mailing_address';

export interface AddressSearchFormData {
  site_street_number?: string;
  site_route?: string;
  site_city?: string;
  site_state?: string;
  site_zip?: string;
  site_unit?: string;
  county?: string;
  state_county_fips?: string;
}

export interface AddressSearchPayload extends AddressSearchFormData {
  address_type?: PropertyAddressType;
  siteStateForMailing?: string;
  site_full_address?: string;
  site_address?: string;
  searchTime?: string;
}

export interface OwnerSearchPayload {
  first_name?: string;
  last_name?: string;
  state_county_fips?: string;
  search_entire_state?: boolean;
}

export interface ParcelSearchPayload {
  parcel_number?: string;
  state_county_fips?: string;
}

export interface CountyFipsOption {
  fips: string;
  name: string;
}

export interface CountyChoice {
  key: string;
  value: string;
}

export interface PropertySearchResult {
  records: Record<string, unknown>[];
  rawRecords: PropertyRecordRaw[];
  message: string;
  count: number;
}

export interface PropertySearchSession {
  sessionId: string;
  title: string;
  searchType: PropertySearchTab;
  rows: Record<string, unknown>[];
  rawRecords: PropertyRecordRaw[];
  createdAt: number;
  lastPayload?: AddressSearchPayload | OwnerSearchPayload | ParcelSearchPayload;
}

export interface AddressSearchHistoryEntry extends AddressSearchFormData {
  address_type?: PropertyAddressType;
  siteStateForMailing?: string;
  searchTime?: string;
}

export const PROPERTY_SEARCH_HISTORY_KEY = 'orderReportSearches';
