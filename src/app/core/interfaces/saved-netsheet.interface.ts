export interface SavedNetsheetRecord {
  netsheet_id: number | string;
  property_id?: number | string;
  property_address?: string;
  netsheet_type?: string;
  netsheet_last_saved?: string;
  time_last_saved?: string;
  [key: string]: unknown;
}

export interface TtbNetsheetListResponse {
  response: {
    status: string;
    message?: string;
    count?: number;
    data?: SavedNetsheetRecord[];
  };
}

export interface DeleteNetsheetPayload {
  netsheet_id: number;
}

export interface TtbDeleteNetsheetResponse {
  response: {
    status: string;
    data?: string[] | { msg?: string };
  };
}
