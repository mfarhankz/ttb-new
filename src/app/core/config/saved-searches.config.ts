import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';

export interface SavedSearchFilterFieldOption {
  value: string;
  label: string;
}

export const SAVED_SEARCHES_FILTER_FIELD_OPTIONS: SavedSearchFilterFieldOption[] = [
  { value: '$', label: 'All fields' },
  { value: 'name', label: 'Query Name' },
  { value: 'createdBy', label: 'Created By' },
  { value: 'sharedTo', label: 'Shared To' },
  { value: 'createdOn', label: 'Created on' }
];

export const SAVED_SEARCHES_COLUMNS: DataTableColumn[] = [
  { key: 'actions', label: '', variant: 'actions', sortable: false, align: 'center', width: 'w-16 min-w-[4.5rem]' },
  { key: 'name', label: 'Query Name', sortType: 'text', truncate: true, width: 'min-w-[14rem]' },
  { key: 'createdBy', label: 'Created By', sortType: 'text', truncate: true, width: 'min-w-[10rem]' },
  { key: 'sharedTo', label: 'Shared To', sortType: 'text', truncate: true, width: 'min-w-[10rem]' },
  { key: 'createdOn', label: 'Created on', sortType: 'date', width: 'min-w-[9rem]', nowrap: true }
];

export const SAVED_SEARCHES_DEFAULT_PAGE_SIZE = 100;

export const SAVED_SEARCHES_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const SAVED_SEARCHES_EMPTY_COPY = {
  title: 'No saved searches yet',
  description: 'Saved property search criteria from the Query Tool will appear here.'
};
