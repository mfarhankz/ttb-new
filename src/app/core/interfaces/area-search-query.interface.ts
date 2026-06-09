import { AreaSearchPayload } from './area-search-field.interface';

export interface RecentAreaSearchQuery {
  id: string;
  name: string;
  query: AreaSearchPayload;
  resultCount?: number;
  createdAt: number;
  modifiedAt: number;
}

export interface CommonAreaSearchQuery {
  query_id?: number | string;
  name?: string;
  query?: AreaSearchPayload;
  created?: string;
  modified?: string;
  [key: string]: unknown;
}

export interface SaveQueryRequest {
  name: string;
  query: AreaSearchPayload;
  is_to_update?: boolean;
  query_id?: number | string;
}

export interface ShareQueryRequest {
  shared_to_email: string;
  direct_share?: boolean;
  query: AreaSearchPayload;
  name?: string;
}

export interface SendDataRequest {
  shared_to_email: string;
  query: AreaSearchPayload;
  [key: string]: unknown;
}
