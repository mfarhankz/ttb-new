export interface AdminOfficeTbOffice {
  office_id?: number | string;
  corporate_name?: string;
  dba?: string;
  lic_number?: string;
  created_date?: string;
  agency_identifier?: string;
  agency_conf?: string | Record<string, unknown>;
  type?: number | string;
}

export interface AdminOfficeTbAddress {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface AdminOfficeTbPhone {
  phone?: string;
}

export interface AdminOfficeTbEmail {
  email?: string;
}

export interface AdminOfficeRecord {
  serial_number?: number;
  TbOffice?: AdminOfficeTbOffice;
  TbAddress?: AdminOfficeTbAddress | AdminOfficeTbAddress[];
  TbPhone?: AdminOfficeTbPhone | AdminOfficeTbPhone[];
  TbEmail?: AdminOfficeTbEmail | AdminOfficeTbEmail[];
}

export interface AdminOfficePipelineData {
  object?: AdminOfficeRecord[];
  count?: number;
}

export interface AdminOfficePipelineResponse {
  response?: {
    status?: string;
    message?: string;
    data?: AdminOfficePipelineData;
  };
}

export interface AdminOfficeTableBadge {
  label: string;
  tone?: string;
  display?: 'text' | 'badge';
}
