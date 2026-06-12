import { DataTableRowAction } from '@app/shared/ui/data-table/data-table.types';

export type StatisticsTractActionId = 'area-search';

export interface StatisticsTractActionDefinition {
  id: StatisticsTractActionId;
  label: string;
}

export const STATISTICS_TRACT_ACTION_DEFINITIONS: StatisticsTractActionDefinition[] = [
  { id: 'area-search', label: 'Area Search' }
];

export function resolveStatisticsTractRowActions(): DataTableRowAction[] {
  return STATISTICS_TRACT_ACTION_DEFINITIONS.map((action) => ({
    id: action.id,
    label: action.label
  }));
}
