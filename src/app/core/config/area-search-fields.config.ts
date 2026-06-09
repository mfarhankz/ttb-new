export const AREA_SEARCH_FIELDS_STORAGE_KEY = 'QTFormFieldGroupsV2';
export const AREA_SEARCH_PROCESSED_FIELDS_STORAGE_KEY = 'QTFormFieldGroupsProcessedV2';
export const AREA_SEARCH_FIELDS_VERSION_KEY = 'global_search_fields_version';
export const AREA_SEARCH_RECENT_QUERIES_KEY = 'QTRecentQueries';

export const PREMIUM_FIELD_GROUP_IDS = [4, 7, 8] as const;

export const AREA_SEARCH_CONTACT_FIELD_NAME = 'include_contact_info';

/** Legacy criteria box always shows these fields even when they match defaults. */
export const AREA_SEARCH_CRITERIA_ALWAYS_VISIBLE_FIELDS = new Set([
  'mm_fips_state_code',
  'use_code_std'
]);

/** Criteria chips follow the geographic search hierarchy left-to-right. */
export const AREA_SEARCH_CRITERIA_GEOGRAPHIC_ORDER = [
  'mm_fips_state_code',
  'mm_fips_muni_code',
  'sa_site_city',
  'sa_site_zip'
] as const;

/** Legacy dynamicRadioButtons sort order for the contact field. */
export const AREA_SEARCH_CONTACT_CHOICE_ORDER = ['PH', 'EM', '$'] as const;

/** Legacy Query Tool placeholders for searchable choice fields. */
export const AREA_SEARCH_CHOICE_PLACEHOLDERS: Record<string, string> = {
  mm_fips_state_code: 'E.g AK',
  mm_fips_muni_code: 'E.g ALAMEDA',
  sa_site_city: 'Select',
  sa_site_zip: 'Select',
  sa_mail_state: 'Select',
  leads_type: 'Select'
};

export const AREA_SEARCH_CHOICE_LOADING_PLACEHOLDER = 'Loading…';

/** Dependent geographic fields must not prefill from API defaults. */
export const AREA_SEARCH_NO_DEFAULT_FIELDS = new Set([
  'mm_fips_muni_code',
  'sa_site_city',
  'sa_site_zip'
]);

/** Warm child choice lists when a parent geographic field has a value. */
export const AREA_SEARCH_DEPENDENT_CHOICE_PREFETCH: Record<string, readonly string[]> = {
  mm_fips_state_code: ['mm_fips_muni_code'],
  mm_fips_muni_code: ['sa_site_city', 'sa_site_zip']
};

export const AREA_SEARCH_RANGE_MATCH_OPTIONS = [
  { value: 'Between', label: 'Between' },
  { value: '=', label: 'Equal to' },
  { value: 'Not', label: 'Not' },
  { value: '>', label: 'Greater than' },
  { value: '>=', label: 'Greater than or Equal to' },
  { value: '<', label: 'Less than' },
  { value: '<=', label: 'Less than or Equal to' }
] as const;

export const AREA_SEARCH_DATE_MATCH_OPTIONS = [
  { value: 'Between', label: 'Between' },
  { value: '=', label: 'On' },
  { value: 'Last_x_Months', label: 'Last X Months' },
  { value: 'Not', label: 'Not' },
  { value: '>', label: 'After' },
  { value: '>=', label: 'On or After' },
  { value: '<', label: 'Before' },
  { value: '<=', label: 'On or Before' }
] as const;

export const AREA_SEARCH_WILDCARD_MATCH_OPTIONS = ['Contains', 'Starts/w', 'Excludes', 'Is'] as const;

export const AREA_SEARCH_RANGE_DEFAULT_OPTION_INDEX = 1;
export const AREA_SEARCH_WILDCARD_DEFAULT_OPTION_INDEX = 0;

export const AREA_SEARCH_CUSTOM_FILTERS_GROUP_ID = 6;

export const AREA_SEARCH_VALIDATION_FLAGGED_FIELDS = [
  'sa_nbr_bedrms',
  'sa_nbr_bath',
  'sa_lotsize',
  'sa_sqft',
  'sa_nbr_units',
  'sa_yr_blt'
] as const;

export const AREA_SEARCH_TAB_ICONS: Record<string, string> = {
  basic: 'pi pi-home',
  location: 'pi pi-map-marker',
  property: 'pi pi-building',
  mortgage: 'pi pi-dollar',
  leads: 'pi pi-bolt',
  custom: 'pi pi-filter',
  phones: 'pi pi-phone'
};

export const AREA_SEARCH_DEFAULT_MAX_LIMIT = 1000;

/** Fallback tab labels when BE returns an empty group_name. */
export const AREA_SEARCH_DEFAULT_GROUP_NAMES: Record<number, string> = {
  1: 'General',
  2: 'Property Characteristics',
  3: 'Assessment & Taxes',
  4: 'Mortgage Info',
  5: 'Other',
  6: 'Custom Filters',
  7: 'Leads',
  8: 'Phones And Emails'
};
