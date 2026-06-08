import { DataTableRowAction } from '@app/shared/components/data-table/data-table.types';

export type SavedSearchActionId = 'select' | 'rename' | 'share' | 'delete' | 'dynamic-data';

export interface SavedSearchActionDefinition {
  id: SavedSearchActionId;
  label: string;
}

export const SAVED_SEARCH_ACTION_DEFINITIONS: SavedSearchActionDefinition[] = [
  { id: 'select', label: 'Select' },
  { id: 'rename', label: 'Rename' },
  { id: 'share', label: 'Share' },
  { id: 'delete', label: 'Delete' }
];

/** Legacy adds this when `app_config.automation_support` is enabled. */
export const SAVED_SEARCH_DYNAMIC_DATA_ACTION: SavedSearchActionDefinition = {
  id: 'dynamic-data',
  label: 'Dynamic Data'
};

export function resolveSavedSearchRowActions(includeDynamicData = false): DataTableRowAction[] {
  const actions = [...SAVED_SEARCH_ACTION_DEFINITIONS];
  if (includeDynamicData) {
    actions.push(SAVED_SEARCH_DYNAMIC_DATA_ACTION);
  }

  return actions.map((action) => ({
    id: action.id,
    label: action.label
  }));
}
