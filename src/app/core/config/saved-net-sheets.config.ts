import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';

export interface SavedNetSheetFilterFieldOption {
  value: string;
  label: string;
}

export const SAVED_NET_SHEETS_FILTER_FIELD_OPTIONS: SavedNetSheetFilterFieldOption[] = [
  { value: '$', label: 'All fields' },
  { value: 'propertyAddress', label: 'Property Address' },
  { value: 'netsheetType', label: 'Net Sheet' },
  { value: 'lastSaved', label: 'Last saved' }
];

export const SAVED_NET_SHEETS_COLUMNS: DataTableColumn[] = [
  { key: 'actions', label: '', variant: 'actions', sortable: false, align: 'center', width: 'w-16 min-w-[4.5rem]' },
  { key: 'propertyAddress', label: 'Property Address', sortType: 'text', truncate: true, width: 'min-w-[16rem]' },
  { key: 'netsheetType', label: 'Net Sheet', sortType: 'text', width: 'min-w-[8rem]' },
  { key: 'lastSaved', label: 'Last saved', sortType: 'date', width: 'min-w-[9rem]', nowrap: true }
];

export const SAVED_NET_SHEETS_DEFAULT_PAGE_SIZE = 100;

export const SAVED_NET_SHEETS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const SAVED_NET_SHEETS_EMPTY_COPY = {
  title: 'No saved net sheets yet',
  description: 'Saved net sheet calculations will appear here once you save them from a property.'
};
