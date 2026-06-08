import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';

export const SAVED_FARMS_COLUMNS: DataTableColumn[] = [
  { key: 'name', label: 'Farm Name', sortType: 'text', truncate: true, width: 'min-w-[14rem]' },
  {
    key: 'propertyCount',
    label: '# of Properties',
    variant: 'numeric',
    sortType: 'number',
    align: 'right',
    width: 'w-36',
    nowrap: true
  },
  { key: 'createdOn', label: 'Created on', sortType: 'date', width: 'min-w-[9rem]', nowrap: true }
];
