import { MapDrawnGeometry } from '@app/authenticated/map/services/ol-map.service';

export interface StatsRangeFieldValue {
  match?: string;
  from?: number | string;
  to?: number | string;
  value?: number | string | { from?: number | string; to?: number | string };
}

export interface TractStatsFormData {
  mm_fips_state_code?: string;
  mm_fips_muni_code?: string;
  sa_site_city_value?: string[];
  sa_site_zip_value?: string[];
  sa_site_city?: string[];
  sa_site_zip?: string[];
  use_code_std?: string[];
  tract_type?: string;
  total_units?: StatsRangeFieldValue;
  avg_price?: StatsRangeFieldValue;
  turnover_rate?: StatsRangeFieldValue;
  NOO_ratio?: StatsRangeFieldValue;
  avg_yr_owned?: StatsRangeFieldValue;
  geometry?: {
    match: string;
    value: MapDrawnGeometry['value'];
  };
}

export interface TractStatsInfo {
  tract_type?: string;
  geometry?: MapDrawnGeometry;
  groupType?: string;
  [key: string]: unknown;
}

export interface TractRecord {
  tract_value: string;
  serial_number: number;
  sa_site_city?: string;
  sa_site_zip?: string;
  mm_fips_state_code?: string;
  mm_fips_muni_code?: string;
  turnover_rate?: number | string;
  total_units?: string;
  total_sales?: string;
  avg_yr_owned?: string;
  avg_price?: number | string;
  NOO_ratio?: number | string;
  customTurnoverRate?: string;
  customAvgPrice?: string;
  customNOORatio?: string;
  geo?: number[];
  boundary?: boolean;
  [key: string]: unknown;
}

export interface TractStatsSearchResult {
  records: TractRecord[];
  info: TractStatsInfo;
}
