import { SavedFarmGeometry } from './saved-farm.interface';

/** Raw property record from legacy get_farm / search pipelines. */
export interface PropertyRecordRaw {
  sa_property_id?: number | string;
  sa_site_house_nbr?: string;
  sa_site_street_name?: string;
  sa_site_city?: string;
  sa_site_zip?: string;
  sa_site_state?: string;
  sa_mail_state?: string;
  v_unit?: string;
  sa_date_transfer?: string;
  sa_val_transfer?: number | string;
  formatted_sa_owner_1?: string;
  sa_parcel_nbr_primary?: string;
  v_tract?: string;
  sa_subdivision?: string;
  use_code_std?: string;
  sa_sqft?: number | string;
  sa_nbr_bedrms?: number | string;
  sa_nbr_bath?: number | string;
  sa_nbr_units?: number | string;
  sa_site_mail_same?: string;
  sa_x_coord?: number | string;
  sa_y_coord?: number | string;
  phone?: string;
  phone_multiple?: unknown;
  emailaddr?: string;
  sell_score?: number | string | null;
  refi_score?: number | string | null;
  [key: string]: unknown;
}

export interface FarmPropertyPaging {
  count?: number;
  pageCount?: number;
  page?: number;
  limit?: number;
}

export interface GetFarmPropertiesResponse {
  response: {
    status: string;
    message?: string;
    data?: PropertyRecordRaw[];
    paging?: FarmPropertyPaging;
    count?: number;
  };
}

export interface FarmMetainfoByIdResponse {
  response: {
    status: string;
    message?: string;
    data?: {
      farm_id?: number | string;
      name?: string;
      farm_name?: string;
      alias?: string;
      geometry?: SavedFarmGeometry | SavedFarmGeometry[];
      p_status?: string | null;
      e_status?: string | null;
      [key: string]: unknown;
    };
  };
}

export interface DetailPageRouterState {
  title?: string;
  geometry?: SavedFarmGeometry | SavedFarmGeometry[];
}
