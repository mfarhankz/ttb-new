export interface AdminUserNameCol {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  type?: number | string;
  status?: number | string;
  profile_id?: string | number;
  user_type_label?: string;
  subscription_status?: number | string;
}

export interface AdminUserUserCol {
  users_id?: number | string;
  username?: string;
  is_assigned?: number | string | boolean;
  parent_user_id?: number | string;
  last_login?: string;
  license_number?: string;
  reboconnect_partner_keys?: string[];
}

export interface AdminUserRecord {
  name_col?: AdminUserNameCol;
  user_col?: AdminUserUserCol;
  TbUser?: AdminUserNameCol & { username?: string; users_id?: number | string };
  TbEmail?: Array<{ email?: string }>;
  email_col?: Array<{ email?: string }>;
}

export interface AdminUserPipelineData {
  data?: AdminUserRecord[];
  count?: number;
  paging?: {
    pageCount?: number;
  };
}

export interface AdminUserPipelineResponse {
  response?: {
    status?: string;
    message?: string;
    data?: AdminUserPipelineData;
  };
}

export interface AdminUserTableBadge {
  label: string;
  tone?: string;
}
