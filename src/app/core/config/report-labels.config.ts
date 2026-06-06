/** Legacy REPORT_LABELS — human-readable report type names for order history. */
export const REPORT_TYPE_LABELS: Record<string, string> = {
  property_profile: 'Full Profile Report',
  property_profile_d: 'Profile Report (Digital)',
  property_profile_s: 'Profile Report (Standard)',
  property_profile_sd: 'Profile Report (Standard Digital)',
  property_profile_TRIO: 'TRIO Property Profile',
  net_sheet: 'Net Sheet',
  comparable_view: 'Comparable View',
  phone_email_lookup: 'Phone & Email Lookup'
};

export function formatReportType(type?: string | null): string {
  if (!type) {
    return '—';
  }

  const trimmed = type.trim();
  return REPORT_TYPE_LABELS[trimmed] ?? trimmed.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
