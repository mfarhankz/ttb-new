export type AreaSearchFieldType = 'C' | 'CM' | 'CT' | 'R' | 'W' | 'EM' | 'CHB' | 'RDB' | 'geometry';

export interface AreaSearchFieldChoice {
  label?: string;
  value?: string;
  [key: string]: unknown;
}

export interface AreaSearchFieldMeta {
  field_name: string;
  label: string;
  search_type: AreaSearchFieldType;
  group_id: number;
  field_order?: number;
  custom_field_id?: number;
  include?: number;
  layout_row?: boolean;
  value_type?: string;
  default_value?: unknown;
  choices?: Record<string, string> | AreaSearchFieldChoice[];
  grouping_choices?: Record<string, Record<string, string>>;
  choices_source?: {
    behavior?: string;
    endpoint?: string;
    inputs?: string[];
    [key: string]: unknown;
  };
  validation?: Record<string, unknown>;
  ngRequired?: string;
  note?: string;
  noteLabel?: string;
  inputsChecksExec?: string;
  [key: string]: unknown;
}

export interface AreaSearchFieldGroup {
  group_id: number;
  group_name: string;
  group_order?: number;
  layout_row?: boolean;
  fields: AreaSearchFieldMeta[];
  other_fields?: AreaSearchFieldMeta[] | null;
  [key: string]: unknown;
}

export interface AreaSearchFormFieldValue {
  search_type?: AreaSearchFieldType;
  value?: unknown;
  match?: string;
  from?: unknown;
  to?: unknown;
  check?: boolean;
}

export interface AreaSearchFormData {
  omit_saved_records?: AreaSearchFormFieldValue;
  max_limit?: AreaSearchFormFieldValue;
  geometry?: AreaSearchFormFieldValue;
  [fieldName: string]: AreaSearchFormFieldValue | undefined;
}

export interface AreaSearchSearchOptions {
  omit_saved_records?: boolean;
  max_limit?: number;
  include_contact_info?: string[];
  [key: string]: unknown;
}

export interface AreaSearchPayload {
  searchOptions?: AreaSearchSearchOptions;
  customFilters?: Record<string, unknown>;
  geometry?: {
    match?: string;
    value?: unknown;
    search_type?: 'geometry';
  };
  [fieldName: string]: unknown;
}

export interface AreaSearchFieldsInfo {
  [fieldName: string]: AreaSearchFieldMeta;
}
