import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';

export type SavedFarmTabId = 'main' | 'phoneEmail' | 'dla' | 'riskScore';

export interface SavedFarmTabDefinition {
  id: SavedFarmTabId;
  label: string;
  icon: string;
}

export const SAVED_FARM_TABS: SavedFarmTabDefinition[] = [
  { id: 'main', label: 'Main Farms', icon: 'pi pi-bookmark' },
  { id: 'phoneEmail', label: 'Single Look Up (PH/EM) Farms', icon: 'pi pi-phone' },
  { id: 'dla', label: 'DLA Farms', icon: 'pi pi-bell' },
  { id: 'riskScore', label: 'Risk Score Farms', icon: 'pi pi-chart-line' }
];

export interface SavedFarmFilterFieldOption {
  value: string;
  label: string;
}

export const SAVED_FARMS_FILTER_FIELD_OPTIONS: SavedFarmFilterFieldOption[] = [
  { value: '$', label: 'All fields' },
  { value: 'name', label: 'Farm Name' },
  { value: 'propertyCount', label: '# of Properties' },
  { value: 'createdOn', label: 'Created on' }
];

export const SAVED_FARMS_COLUMNS: DataTableColumn[] = [
  { key: 'actions', label: '', variant: 'actions', sortable: false, align: 'center', width: 'w-16 min-w-[4.5rem]' },
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

/** Legacy farms pipeline used 100 records per page. */
export const SAVED_FARMS_DEFAULT_PAGE_SIZE = 100;

export const SAVED_FARMS_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const SAVED_FARM_EMPTY_COPY: Record<SavedFarmTabId, { title: string; description: string }> = {
  main: {
    title: 'No main farms yet',
    description: 'Saved farms from your property searches will appear here.'
  },
  phoneEmail: {
    title: 'No phone/email lookup farms',
    description: 'Single phone or email lookup farms will appear here.'
  },
  dla: {
    title: 'No DLA farms yet',
    description: 'Daily Lead Alert farms will appear here once configured.'
  },
  riskScore: {
    title: 'No risk score farms yet',
    description: 'Risk score farms will appear here once created.'
  }
};
