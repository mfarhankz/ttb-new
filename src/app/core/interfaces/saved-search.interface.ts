export interface SavedSearchRecord {
  query_id: number | string;
  name?: string;
  query?: Record<string, unknown>;
  user_id?: string | number;
  shared_to?: string | null;
  created?: string;
  modified?: string;
  live_query_status?: string | number | null;
  monitor_enabled?: string | number;
  monitor_config?: string;
  created_by_user?: string;
  shared_to_user?: string;
  shared_by_user?: string;
  [key: string]: unknown;
}

export interface TtbSavedQueriesResponse {
  response: {
    status: string;
    message?: string;
    count?: number;
    data?: SavedSearchRecord[];
  };
}

export interface RemoveQueryPayload {
  query_ids: number[];
}

export interface RenameQueryPayload {
  query_id: number;
  new_name: string;
}

export interface TtbRemoveQueryResponse {
  response: {
    status: string;
    data?: {
      msg?: string | string[];
    };
  };
}

export interface TtbRenameQueryResponse {
  response: {
    status: string;
    message?: string;
    data?: unknown;
  };
}
