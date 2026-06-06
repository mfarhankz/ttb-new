export interface TbUserRecord {
  users_id?: number | string;
  username?: string;
  password?: string;
  confirm_password?: string;
  type?: number | string;
  status?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  user_pic?: string | null;
  office_id?: number | string;
  parent_user_id?: number | string;
  name?: string;
}

export interface TbAddressRecord {
  address_id?: number | string;
  type?: string;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface TbPhoneRecord {
  phone_id?: number | string;
  type?: string;
  phone?: number | string | null;
}

export interface TbEmailRecord {
  email_id?: number | string;
  type?: string;
  email?: string;
}

export interface TbAssociationRecord {
  parent_user_id?: number | string;
  parent_user_name?: string;
}

export interface TbLicenseRecord {
  license_number?: string;
  expiration_date?: string;
}

export interface UserProfileModel {
  TbUser: TbUserRecord;
  TbAddress: TbAddressRecord[];
  TbPhone: TbPhoneRecord[];
  TbEmail: TbEmailRecord[];
  TbAssociation?: TbAssociationRecord;
  TbLicense?: TbLicenseRecord;
  TbOffice?: Record<string, unknown>;
}

export interface RepProfileSummary {
  fullName: string;
  phone?: string | number;
  email?: string;
}

export interface TtbLoadUserProfileResponse {
  response: {
    status: string;
    message?: string;
    data: {
      object?: UserProfileModel;
      msg?: string;
    };
  };
}

export interface TtbEditUserResponse {
  response: {
    status: string;
    message?: string;
    data: Array<{ user_col?: TbUserRecord }> | string[];
  };
}

export interface TtbChangePasswordResponse {
  response: {
    status: string;
    message?: string;
    data?: string[];
  };
}

export interface TtbProfilePicResponse {
  response: {
    status: string;
    message?: string;
    data: string | { user_pic?: string; msg?: string };
  };
}
