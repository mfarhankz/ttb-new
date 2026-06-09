import { AreaSearchPayload } from './area-search-field.interface';
import { PropertyRecordRaw } from './property-record.interface';

export interface GlobalSearchPagingInfo {
  page?: number;
  limit?: number;
  total?: number;
  total_found?: number;
  [key: string]: unknown;
}

export interface GlobalSearchCountData {
  total_found?: number;
  rec_count?: number;
  rec_price?: number;
  rec_group_zip?: Record<string, unknown>;
  message?: string;
  [key: string]: unknown;
}

export interface GlobalSearchResponseData {
  recs?: PropertyRecordRaw[];
  paging_info?: GlobalSearchPagingInfo;
  query?: AreaSearchPayload;
  leads_type?: string[];
  leads_attr?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface TtbGlobalSearchCountResponse {
  response: {
    status: string;
    message?: string;
    data?: GlobalSearchCountData;
  };
}

export interface TtbGlobalSearchResponse {
  response: {
    status: string;
    message?: string;
    data?: GlobalSearchResponseData;
  };
}

export interface TtbSearchFieldsResponse {
  response?: {
    status?: string;
    data?: unknown;
  };
  data?: unknown;
}
