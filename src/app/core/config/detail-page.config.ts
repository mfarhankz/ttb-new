import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';
import { resolveLeadTypeLabel } from '../utils/property-record.mapper';

export interface DetailFilterOption {
  value: string;
  label: string;
}

/** Legacy FIELD_TYPES.propsFilters */
export const FARM_DETAIL_FILTER_OPTIONS: DetailFilterOption[] = [
  { value: 'is_all_search', label: 'ALL' },
  { value: 'is_out_of_state_search', label: 'OUT OF STATE' },
  { value: 'sa_site_mail_same', label: 'OWNER OCCUPIED' },
  { value: 'is_nonowner_search', label: 'ABSENTEE OWNERS' },
  { value: 'is_empty_nester_search', label: 'EMPTY NESTERS' },
  { value: 'is_next_sellers_search', label: 'NEXT SELLERS' },
  { value: 'is_recent_changes_search', label: 'RECENT CHANGES' }
];

export const DETAIL_PAGE_DEFAULT_FILTER = 'is_all_search';

export const DETAIL_PAGE_DEFAULT_PAGE_SIZE = 25;

export const DETAIL_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export interface DetailSearchFieldOption {
  value: string;
  label: string;
}

export const STATISTICS_DETAIL_COLUMNS: DataTableColumn[] = [
  {
    key: 'serialNumber',
    label: '#',
    sortType: 'number',
    variant: 'mapPin',
    align: 'center',
    width: 'w-12',
    nowrap: true
  },
  { key: 'tract_value', label: 'Group', sortType: 'text', truncate: true, width: 'min-w-40' },
  { key: 'sa_site_city', label: 'City', sortType: 'text', truncate: true, width: 'min-w-32' },
  { key: 'sa_site_zip', label: 'Zip', sortType: 'text', width: 'w-24', nowrap: true },
  { key: 'customTurnoverRate', label: 'Turn Over', sortType: 'text', width: 'w-28', nowrap: true },
  { key: 'total_units', label: '# of Homes', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-28', nowrap: true },
  { key: 'total_sales', label: 'Total Sales', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-28', nowrap: true },
  { key: 'customAvgPrice', label: 'Average Price', sortType: 'text', width: 'min-w-32', nowrap: true },
  { key: 'avg_yr_owned', label: 'Avg Yr Owned', sortType: 'text', width: 'w-28', nowrap: true },
  { key: 'customNOORatio', label: 'NOO Ratio', sortType: 'text', width: 'w-28', nowrap: true }
];

export const STATISTICS_SEARCH_FIELD_OPTIONS: DetailSearchFieldOption[] = [
  { value: '$', label: 'All fields' },
  { value: 'tract_value', label: 'Group' },
  { value: 'sa_site_city', label: 'City' },
  { value: 'sa_site_zip', label: 'Zip' }
];

export const DETAIL_SEARCH_FIELD_OPTIONS: DetailSearchFieldOption[] = [
  { value: '$', label: 'All fields' },
  { value: 'customAddress', label: 'Address' },
  { value: 'customCity', label: 'City' },
  { value: 'sa_site_zip', label: 'Zip' },
  { value: 'formatted_sa_owner_1', label: 'Owner Name' },
  { value: 'sa_parcel_nbr_primary', label: 'APN' },
  { value: 'customTract', label: 'Tract' },
  { value: 'use_code_std', label: 'Prop Type' },
  { value: 'customPhone', label: 'Phone' },
  { value: 'emailaddr', label: 'Email' }
];

type ColumnVisibility = 'always' | 'any' | 'first' | 'phone' | 'score';

interface DetailColumnDefinition extends DataTableColumn {
  rawField?: string;
  visibility?: ColumnVisibility;
}

/** Legacy properties pipeline column order and visibility rules. */
const DETAIL_COLUMN_DEFINITIONS: DetailColumnDefinition[] = [
  {
    key: 'serialNumber',
    label: '#',
    sortType: 'number',
    variant: 'mapPin',
    align: 'center',
    width: 'w-12',
    nowrap: true,
    visibility: 'always'
  },
  { key: 'customAddress', label: 'Address', sortType: 'text', truncate: true, width: 'min-w-56', visibility: 'always' },
  { key: 'v_unit', label: 'Unit', sortType: 'text', width: 'w-20', nowrap: true, visibility: 'always' },
  { key: 'customCity', label: 'City', sortType: 'text', truncate: true, width: 'min-w-32', visibility: 'always' },
  { key: 'sa_site_zip', label: 'Zip', sortType: 'text', width: 'w-24', nowrap: true, visibility: 'always' },
  { key: 'sa_mail_state', label: 'Mail State', sortType: 'text', width: 'w-24', nowrap: true, rawField: 'sa_mail_state', visibility: 'first' },
  { key: 'customSoldIn', label: 'Sold in', sortType: 'text', width: 'w-24', nowrap: true, visibility: 'always' },
  { key: 'customPrice', label: '$', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-28', nowrap: true, visibility: 'always' },
  { key: 'sr_title_co_name', label: 'Title Company Name', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'sr_title_co_name', visibility: 'any' },
  { key: 'sr_full_part_code', label: 'Full Transfer Flag', sortType: 'text', width: 'min-w-40', nowrap: true, rawField: 'sr_full_part_code', visibility: 'any' },
  { key: 'formatted_sa_owner_1', label: 'Owner Name', sortType: 'text', truncate: true, width: 'min-w-48', visibility: 'always' },
  { key: 'customPhone', label: 'Phone', sortType: 'text', width: 'min-w-36', nowrap: true, visibility: 'phone' },
  { key: 'emailaddr', label: 'Email', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'emailaddr', visibility: 'any' },
  { key: 'sa_parcel_nbr_primary', label: 'APN', sortType: 'text', truncate: true, width: 'min-w-40', visibility: 'always' },
  { key: 'customTract', label: 'Tract', sortType: 'text', truncate: true, width: 'min-w-32', visibility: 'always' },
  { key: 'use_code_std', label: 'Prop Type', sortType: 'text', width: 'min-w-36', nowrap: true, visibility: 'always' },
  { key: 'sa_sqft', label: 'Sqft', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-24', nowrap: true, visibility: 'always' },
  { key: 'sa_nbr_units', label: 'Unit Total', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-24', nowrap: true, rawField: 'sa_nbr_units', visibility: 'any' },
  { key: 'sa_nbr_bedrms', label: 'Bd', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-16', nowrap: true, visibility: 'always' },
  { key: 'sa_nbr_bath', label: 'Ba', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-16', nowrap: true, visibility: 'always' },
  { key: 'customOccupiedBy', label: 'Occupied By', sortType: 'text', width: 'min-w-32', nowrap: true, visibility: 'always' },
  {
    key: 'sell_score_display',
    label: 'Sell Score',
    variant: 'score',
    sortType: 'number',
    width: 'min-w-34',
    nowrap: true,
    rawField: 'sell_score',
    visibility: 'score'
  },
  {
    key: 'refi_score_display',
    label: 'Refi Score',
    variant: 'score',
    sortType: 'number',
    width: 'min-w-34',
    nowrap: true,
    rawField: 'refi_score',
    visibility: 'score'
  },
  { key: 'first_position_lender_type', label: 'First Position Lender Type', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'first_position_lender_type', visibility: 'first' },
  { key: 'first_position_lndr_first_name', label: 'First Position Lndr First Name', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'first_position_lndr_first_name', visibility: 'first' },
  { key: 'first_position_estimated_interest_rate', label: 'First Position Estimated Interest Rate', sortType: 'text', width: 'min-w-48', nowrap: true, rawField: 'first_position_estimated_interest_rate', visibility: 'first' },
  { key: 'first_position_loan_type', label: 'First Position Loan Type', sortType: 'text', truncate: true, width: 'min-w-40', rawField: 'first_position_loan_type', visibility: 'first' },
  { key: 'first_position_loan_val', label: 'First Position Loan Val', sortType: 'number', variant: 'numeric', align: 'right', width: 'min-w-36', nowrap: true, rawField: 'first_position_loan_val', visibility: 'first' },
  { key: 'first_position_loan_date', label: 'First Position Loan Date', sortType: 'date', width: 'min-w-36', nowrap: true, rawField: 'first_position_loan_date', visibility: 'first' },
  { key: 'first_position_interest_rate_type', label: 'First Position Interest Rate Type', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'first_position_interest_rate_type', visibility: 'first' },
  { key: 'second_position_lender_type', label: 'Second Position Lender Type', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'second_position_lender_type', visibility: 'first' },
  { key: 'second_position_interest_rate_type', label: 'Second Position Interest Rate Type', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'second_position_interest_rate_type', visibility: 'first' },
  { key: 'second_position_lndr_first_name', label: 'Second Position Lndr First Name', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'second_position_lndr_first_name', visibility: 'first' },
  { key: 'second_position_estimated_interest_rate', label: 'Second Position Estimated Interest Rate', sortType: 'text', width: 'min-w-48', nowrap: true, rawField: 'second_position_estimated_interest_rate', visibility: 'first' },
  { key: 'third_position_lndr_credit_line', label: 'Third Position Lndr Credit Line', sortType: 'text', truncate: true, width: 'min-w-48', rawField: 'third_position_lndr_credit_line', visibility: 'first' },
  { key: 'second_position_loan_date', label: 'Second Position Loan Date', sortType: 'date', width: 'min-w-36', nowrap: true, rawField: 'second_position_loan_date', visibility: 'first' },
  { key: 'second_position_loan_type', label: 'Second Position Loan Type', sortType: 'text', truncate: true, width: 'min-w-40', rawField: 'second_position_loan_type', visibility: 'first' },
  { key: 'second_position_loan_val', label: 'Second Position Loan Val', sortType: 'number', variant: 'numeric', align: 'right', width: 'min-w-36', nowrap: true, rawField: 'second_position_loan_val', visibility: 'first' },
  { key: 'avm_final_value', label: 'AVM Final Value', sortType: 'number', variant: 'numeric', align: 'right', width: 'min-w-36', nowrap: true, rawField: 'avm_final_value', visibility: 'first' },
  { key: 'total_outstanding_loans', label: 'Total Outstanding Loans', sortType: 'number', variant: 'numeric', align: 'right', width: 'min-w-40', nowrap: true, rawField: 'total_outstanding_loans', visibility: 'first' },
  { key: 'ltv', label: 'LTV', sortType: 'number', variant: 'numeric', align: 'right', width: 'w-20', nowrap: true, rawField: 'ltv', visibility: 'first' }
];

function buildLeadDetailColumns(leadsTypes: string[]): DataTableColumn[] {
  return leadsTypes.map(
    (prefix): DataTableColumn => ({
      key: prefix,
      label: resolveLeadTypeLabel(prefix),
      variant: 'leadDetails',
      sortable: false,
      nowrap: true,
      width: 'min-w-[600px]'
    })
  );
}

function recordHasField(record: Record<string, unknown>, field: string): boolean {
  return field in record && record[field] !== undefined;
}

function hasNumericScoreValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  if (typeof value === 'number' && !Number.isNaN(value)) {
    return true;
  }

  if (typeof value === 'string' && !Number.isNaN(Number(value))) {
    return true;
  }

  return false;
}

/** Legacy shouldHideFarmForecastButton — scores are active or pending once fields exist. */
function isNullOrNumericScoreValue(value: unknown): boolean {
  return value === null || hasNumericScoreValue(value);
}

export function shouldHideSellRefiScoresMenuAction(rows: Record<string, unknown>[]): boolean {
  if (!rows.length) {
    return false;
  }

  const record = rows[0];
  return isNullOrNumericScoreValue(record['sell_score']) || isNullOrNumericScoreValue(record['refi_score']);
}

/** Legacy isFarmForecastPending — score fields exist but values are still null (table shows "—"). */
export function isSellRefiScoresPending(rows: Record<string, unknown>[]): boolean {
  if (!rows.length) {
    return false;
  }

  const record = rows[0];
  return record['sell_score'] === null || record['refi_score'] === null;
}

function recordHasPhoneField(record: Record<string, unknown>): boolean {
  return (
    recordHasField(record, 'phone') ||
    recordHasField(record, 'phone_multiple') ||
    recordHasField(record, 'customPhone')
  );
}

function isColumnVisible(definition: DetailColumnDefinition, rows: Record<string, unknown>[]): boolean {
  const mode = definition.visibility ?? 'always';
  if (mode === 'always' || !rows.length) {
    return mode === 'always';
  }

  const rawField = definition.rawField ?? definition.key;

  switch (mode) {
    case 'first':
      return recordHasField(rows[0], rawField);
    case 'phone':
      return rows.some((row) => recordHasPhoneField(row));
    case 'any':
      return rows.some((row) => recordHasField(row, rawField));
    case 'score':
      return rows.some((row) => hasNumericScoreValue(row[rawField]));
    default:
      return true;
  }
}

export function resolveVisibleDetailColumns(
  rows: Record<string, unknown>[],
  leadsTypes: string[] = []
): DataTableColumn[] {
  const staticColumns = DETAIL_COLUMN_DEFINITIONS.filter((definition) => isColumnVisible(definition, rows)).map(
    ({ rawField, visibility: _visibility, ...column }) => ({
      ...column,
      ...(rawField ? { scoreField: rawField } : {})
    })
  );

  return [...staticColumns, ...buildLeadDetailColumns(leadsTypes)];
}

export const DETAIL_PAGE_EMPTY_COPY = {
  title: 'No properties found',
  description: 'No property records match the current filter for this selection.',
  filteredDescription: 'No properties match your current filters. Try a different search or clear filters.'
};

export const STATISTICS_DETAIL_EMPTY_COPY = {
  title: 'No tracts found',
  description: 'No tract records match the current statistics search.',
  filteredDescription: 'No tracts match your current filters. Try a different search or clear filters.'
};
