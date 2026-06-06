export interface UsageCountGroup {
  field: string;
  label: string;
}

export interface UsageMetricGroup {
  field: string;
  label: string;
}

export interface UsageMetricPair {
  request_count?: number;
  recs_count?: number;
  farm_count?: number;
  email_count?: number;
  login_count?: number;
  netsheet?: { request_count?: number };
}

export type UsageMetricMap = Record<string, number | UsageMetricPair | undefined>;

export interface UserUsageDetails {
  total_report_ordered?: Record<string, UsageMetricMap>;
  total_netsheet_pulled?: Record<string, { netsheet?: { request_count?: number } }>;
  total_recs_exported?: Record<string, UsageMetricMap>;
  total_recs_pulled?: Record<string, UsageMetricMap>;
  total_queries?: Record<string, UsageMetricMap>;
  total_farms?: Record<string, UsageMetricMap>;
  total_data_emailed?: Record<string, UsageMetricPair>;
  total_logins?: Record<string, { login_count?: number }>;
}

export const USAGE_COUNT_GROUPS: UsageCountGroup[] = [
  { field: 'all_time', label: 'Total' },
  { field: 'last_6_months', label: 'Last 6 Months' },
  { field: 'last_60_days', label: 'Last 60 Days' },
  { field: 'last_30_days', label: 'Last 30 Days' },
  { field: 'this_month', label: 'This Month' }
];

export const USAGE_REPORT_GROUPS: UsageMetricGroup[] = [
  { field: 'all_types', label: 'Generated Reports' },
  { field: 'property_profile', label: 'Profile with Comps' },
  { field: 'single_page_report', label: 'Single Page Profile' },
  { field: 'tax_bill', label: 'Current Tax Bill' },
  { field: 'prep', label: 'Prep Report' },
  { field: 'docs', label: 'Profile Documents' },
  { field: 'lead_sheet', label: 'Lead Sheet' }
];

export const USAGE_EXPORT_GROUPS: UsageMetricGroup[] = [
  { field: 'all_types', label: 'Exported Records' },
  { field: 'CSV_FARM', label: 'CSV farm' },
  { field: 'CSV_COREFACT', label: 'CSV Corefact' },
  { field: 'LABELS_5160', label: 'Labels PDF' },
  { field: 'PRINT_6_LINE_REPORT', label: '6-line PDF' },
  { field: 'PRINT_5_LINE_REPORT', label: '5-line PDF' },
  { field: 'PRINT_11_LINE_REPORT', label: '11-line PDF' },
  { field: 'WALKING_FARM_SHORT', label: 'Walking Farm (Short)' },
  { field: 'WALKING_FARM_LONG', label: 'Walking Farm (Long)' }
];
