export interface OrderHistoryAddressCol {
  site_address?: string;
  site_city?: string;
  site_state?: string;
  site_zip?: string;
  site_unit?: string;
}

export interface OrderHistoryReportCol {
  type?: string;
}

export interface OrderHistoryStatusCol {
  date_time?: string;
  status?: string | number;
  report_fetch_id?: string | number | null;
}

export interface OrderHistoryUserCol {
  name?: string;
  user_id?: number | string;
  users_id?: number | string;
}

export interface OrderHistoryOfficeCol {
  name?: string;
}

export interface OrderHistoryRecord {
  user_col?: OrderHistoryUserCol;
  office_col?: OrderHistoryOfficeCol;
  address_col?: OrderHistoryAddressCol;
  report_col?: OrderHistoryReportCol;
  status_col?: OrderHistoryStatusCol;
}

export interface OrderPipelineResponse {
  count?: number;
  data?: OrderHistoryRecord[];
  response?: {
    count?: number;
    data?: OrderHistoryRecord[];
    status?: string;
    message?: string;
  };
}
