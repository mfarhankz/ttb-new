import { TtbApiResponse } from './vertical.interface';

export type NetSheetTabId = 'seller' | 'net2sell' | 'refinance' | 'buyer';

export interface NetSheetConfig {
  isBlankMode: boolean;
  savedMode?: boolean;
  viewMode?: boolean;
  propertyId?: string;
  propertyAddress?: string;
  /** Legacy sa_y_coord / latitude for map + street view. */
  latitude?: number;
  /** Legacy sa_x_coord / longitude for map + street view. */
  longitude?: number;
  netSheetId?: string;
  activeTabFieldName?: NetSheetTabId;
  preparedByName?: string;
  preparedForName?: string;
  notClosable?: boolean;
  /** When true, parent renders the blank-mode name field (e.g. card header). */
  blankNameInHeader?: boolean;
}

export interface BlankModePropertyInfo {
  state_fips?: string;
  county_fips?: string;
  site_city?: string;
  site_zip?: string;
  site_address?: string;
}

export interface NetSheetFetchPayload {
  property_id?: string;
  mock_property_info?: BlankModePropertyInfo;
}

export interface NetSheetVariableFeesPayload extends NetSheetFetchPayload {
  sale_price: number;
  loan_amount?: number;
  loan_type?: string;
  netsheet_type: NetSheetTabId | 'seller';
  annual_tax?: number;
  estimated_closing_date?: string;
}

export interface NetSheetSaveTabPayload extends NetSheetFetchPayload {
  netsheet_id?: number | string;
  seller?: Record<string, unknown>;
  buyer?: Record<string, unknown>;
  refinance?: Record<string, unknown>;
  net2sell?: Record<string, unknown>;
}

export interface NetSheetTabMeta {
  netsheet_id?: number | string;
  time_saved?: string;
}

export interface NetSheetParsedMeta {
  labels: {
    combinedSheet: {
      combinedGroup: Record<string, string>;
    };
  };
}

export interface NetSheetData {
  seller?: Record<string, unknown>;
  net2sell?: Record<string, unknown>;
  refinance?: Record<string, unknown>;
  buyer?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  flags?: Record<string, unknown>;
  parsedMeta?: NetSheetParsedMeta;
  mock_property_info?: BlankModePropertyInfo;
}

export interface NetSheetSaveResult {
  netsheet_id?: number | string;
  time_saved?: string;
  msg?: string;
}

export type TtbNetSheetResponse = TtbApiResponse<NetSheetData>;
export type TtbNetSheetSaveResponse = TtbApiResponse<NetSheetSaveResult | string[]>;
export type TtbNetSheetVariableFeesResponse = TtbApiResponse<{
  fees?: Record<string, Record<string, number | string>>;
}>;

export interface NetSheetTabMetaState {
  seller: NetSheetTabMeta;
  net2sell: NetSheetTabMeta;
  refinance: NetSheetTabMeta;
  buyer: NetSheetTabMeta;
}

export interface NetSheetPayerValues {
  seller: Record<string, number>;
  net2sell: Record<string, number>;
  refinance: Record<string, number>;
  buyer: Record<string, number>;
}
