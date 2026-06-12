import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';

export interface PlaSaveQueryRequest {
  property_count: number;
  alm_dns_support: boolean;
  name: string;
  is_to_update: boolean;
  direct_share: boolean;
  query: AreaSearchPayload;
}

export interface PlaSubscribedService {
  id?: string | number;
  query_id?: string | number;
  name?: string;
  source_type?: 'query' | 'farm' | string;
  service_name?: string;
  property_count?: number | string;
  query?: {
    name?: string;
    query?: AreaSearchPayload;
    geometry?: AreaSearchPayload['geometry'];
  };
  fetching?: boolean;
  fetchingErr?: string;
}

export interface PlaSaveQueryResponseData {
  msg?: string;
  [key: string]: unknown;
}

export interface TtbPlaSaveQueryResponse {
  response: {
    status: string;
    message?: string;
    data?: PlaSaveQueryResponseData;
  };
}

export interface PlaHistoryRecord {
  delivery_date?: string;
  properties?: string;
  propertiesHTML?: unknown;
}

export interface TtbPlaHistoryResponse {
  response: {
    status: string;
    message?: string;
    data?: PlaHistoryRecord[];
  };
}

export interface PlaSubscribeSuccessData {
  msg?: string;
  [key: string]: unknown;
}
