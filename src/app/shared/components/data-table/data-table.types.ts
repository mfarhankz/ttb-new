export type DataTableColumnAlign = 'left' | 'center' | 'right';

export type DataTableColumnVariant =
  | 'default'
  | 'numeric'
  | 'badge'
  | 'badges'
  | 'actions'
  | 'muted'
  | 'leadDetails'
  | 'mapPin';

export interface DataTableLeadDetailItem {
  key: string;
  value: unknown;
}

export type DataTableBadgesLayout = 'inline' | 'stacked';

export interface DataTableRowAction {
  id: string;
  label: string;
}

export interface DataTableBadgeCell {
  label: string;
  tone?: string;
  /** Plain text instead of a pill badge (used for name + indicator rows). */
  display?: 'text' | 'badge';
}

export type DataTableSortType = 'text' | 'number' | 'date';

export interface DataTableColumn {
  key: string;
  label: string;
  align?: DataTableColumnAlign;
  variant?: DataTableColumnVariant;
  /** Badge column layout; stacked places name text above indicator pills (legacy offices name). */
  badgesLayout?: DataTableBadgesLayout;
  sortable?: boolean;
  sortType?: DataTableSortType;
  /** Tailwind width utility, e.g. `w-28`, `min-w-[10rem]`, `max-w-xs` */
  width?: string;
  truncate?: boolean;
  nowrap?: boolean;
}

export type DataTableSortDirection = 'asc' | 'desc';
