/** Legacy geometry object stored on saved farms. */
export interface SavedFarmGeometry {
  match?: string;
  type?: string;
  value?: {
    wkt?: string;
    center_lng?: number;
    center_lat?: number;
    radius?: number;
  };
}

export interface SavedFarmRecord {
  farm_id: number | string;
  name?: string;
  alias?: string;
  farm_name?: string;
  farm_record_count?: number | string;
  created?: string;
  modified?: string;
  geometry?: SavedFarmGeometry | SavedFarmGeometry[];
  rec_type?: string;
  notification_config?: unknown;
  live_farm_status?: string | number | boolean | null;
  risk_score_billing_id?: string | number | null;
  [key: string]: unknown;
}

export interface TtbFarmMetainfoResponse {
  response: {
    status: string;
    message?: string;
    count?: number;
    data?: SavedFarmRecord[];
  };
}
