import { DataTableRowAction } from '@app/shared/ui/data-table/data-table.types';

export type SavedFarmActionId = 'select' | 'rename' | 'delete' | 'dynamic-stats';

export interface SavedFarmActionDefinition {
  id: SavedFarmActionId;
  label: string;
}

export const SAVED_FARM_ACTION_DEFINITIONS: SavedFarmActionDefinition[] = [
  { id: 'select', label: 'Select' },
  { id: 'rename', label: 'Rename' },
  { id: 'delete', label: 'Delete' },
  { id: 'dynamic-stats', label: 'Dynamic Stats' }
];

export function resolveSavedFarmRowActions(): DataTableRowAction[] {
  return SAVED_FARM_ACTION_DEFINITIONS.map((action) => ({
    id: action.id,
    label: action.label
  }));
}
