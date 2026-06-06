export type DataTableColumnAlign = 'left' | 'center' | 'right';

export type DataTableColumnVariant = 'default' | 'numeric' | 'badge' | 'muted';

export type DataTableSortType = 'text' | 'number' | 'date';

export interface DataTableColumn {
  key: string;
  label: string;
  align?: DataTableColumnAlign;
  variant?: DataTableColumnVariant;
  sortable?: boolean;
  sortType?: DataTableSortType;
  /** Tailwind width utility, e.g. `w-28`, `min-w-[10rem]`, `max-w-xs` */
  width?: string;
  truncate?: boolean;
  nowrap?: boolean;
}

export type DataTableSortDirection = 'asc' | 'desc';
