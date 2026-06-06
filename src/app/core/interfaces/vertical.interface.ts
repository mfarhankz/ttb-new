/** Legacy TTB API envelope */
export interface TtbApiResponse<T> {
  response: {
    status: string;
    message?: string;
    data: T;
  };
}

export interface VerticalMetaData {
  vertical_name: string;
  vertical_api_url: string;
  samesite_vertical_api_url?: string;
  partner_key: string;
  api_http_only?: boolean;
}

export interface CompanyInfo {
  company_name?: string;
  company_abbreviation?: string;
  logo_url?: string;
  banner_url?: string;
  company_address?: string;
  company_website?: string;
  public_page_logo_url?: string;
  dashboard_logo_url?: string;
  profile_logo?: string;
}

export interface PublicHeaderContent {
  logo_style?: Record<string, string>;
}

export interface SupportInfo {
  help_desk_phone?: string;
  technical_support?: string;
  contact_us_email?: string;
}

export interface VerticalCustomContent {
  public_header?: PublicHeaderContent;
  main_page?: {
    heading_desc?: string;
    watch_the_video_link_hide?: boolean;
  };
  user_home?: {
    need_help_hide?: boolean;
  };
  [key: string]: unknown;
}

export interface VerticalAppConfig {
  url?: string;
  GOOGLE_API_KEY?: string;
  agency_support?: boolean;
  multi_office_support?: boolean;
  support_wallet?: boolean;
  [key: string]: unknown;
}

export interface VerticalContentData {
  app_config: VerticalAppConfig;
  company_info: CompanyInfo;
  support_info?: SupportInfo;
  custom_content: VerticalCustomContent;
  agencies_app_config?: Record<string, Partial<VerticalAppConfig>>;
  [key: string]: unknown;
}

export interface AgencyConfig {
  agency_identifier?: string;
  corporate_name?: string;
  banner_url?: string;
  logo_url?: string;
  public_page_logo_url?: string;
  dashboard_logo_url?: string;
  public_page_logo_style?: Record<string, string>;
  agency_netsheet_support?: number | string;
  agency_netsheet_lockdown?: number | string;
  office_id?: number;
  agency_phone?: string;
  agency_address?: string;
  [key: string]: unknown;
}

export interface AgencyApiOffice {
  TbOffice: {
    office_id: number;
    agency_identifier: string;
    corporate_name?: string;
    agency_conf?: string;
  };
  TbPhone?: Array<{ phone?: string }>;
  TbAddress?: Array<{
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    longitude?: string;
    latitude?: string;
  }>;
}
