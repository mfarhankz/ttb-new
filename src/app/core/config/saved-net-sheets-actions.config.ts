import { DataTableRowAction } from '@app/shared/components/data-table/data-table.types';

export type SavedNetSheetActionId = 'open' | 'delete';

export interface SavedNetSheetActionDefinition {
  id: SavedNetSheetActionId;
  label: string;
}

export const SAVED_NET_SHEET_ACTION_DEFINITIONS: SavedNetSheetActionDefinition[] = [
  { id: 'open', label: 'Open/View' },
  { id: 'delete', label: 'Delete' }
];

export function resolveSavedNetSheetRowActions(): DataTableRowAction[] {
  return SAVED_NET_SHEET_ACTION_DEFINITIONS.map((action) => ({
    id: action.id,
    label: action.label
  }));
}
