import { AddressSearchFormData } from './property-search.interface';

export interface SmartyAutocompleteSuggestion {
  street_line: string;
  secondary?: string;
  city: string;
  state: string;
  zipcode: string;
  entries: number;
  fullAddress?: string;
  fullAddressSelection?: string;
}

export interface SmartyAddressComponents {
  primary_number?: string;
  street_predirection?: string;
  street_name?: string;
  street_suffix?: string;
  street_postdirection?: string;
  secondary_number?: string;
  secondary_designator?: string;
  city_name?: string;
  default_city_name?: string;
  state_abbreviation?: string;
  zipcode?: string;
  plus4_code?: string;
}

export interface SmartyAddressMetadata {
  county_name?: string;
  county_fips?: string;
  latitude?: number;
  longitude?: number;
}

export interface SmartyUSAddressResponse {
  delivery_line_1?: string;
  last_line?: string;
  delivery_point_barcode?: string;
  components: SmartyAddressComponents;
  metadata: SmartyAddressMetadata;
}

export interface SmartyAddressDetails extends AddressSearchFormData {
  site_address?: string;
  site_full_address?: string;
  site_unit_full?: string;
  country?: string;
  state_county_fips?: string;
  smarty_delivery_point_barcode?: string;
  location?: { lat?: number; lng?: number };
}
