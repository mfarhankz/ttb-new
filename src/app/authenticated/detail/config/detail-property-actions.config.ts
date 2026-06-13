import { DataTableRowAction } from '@app/shared/ui/data-table/data-table.types';

export type DetailPropertyActionId =
  | 'trio-property-profile'
  | 'profile-with-comps'
  | 'other-reports'
  | 'detailed-view'
  | 'comparable-view'
  | 'net-sheet'
  | 'phone-email-lookup'
  | 'new-append-farm'
  | 'nearby-neighbors'
  | 'create-note';

export interface DetailPropertyActionDefinition {
  id: DetailPropertyActionId;
  label: string;
}

/** Legacy properties pipeline gear menu (abstract.user.controller.js). */
export const DETAIL_PROPERTY_ACTION_DEFINITIONS: DetailPropertyActionDefinition[] = [
  { id: 'trio-property-profile', label: 'TRIO Property Profile' },
  { id: 'profile-with-comps', label: 'Profile with Comps' },
  { id: 'other-reports', label: 'Other Reports' },
  { id: 'detailed-view', label: 'Detailed view' },
  { id: 'comparable-view', label: 'Comparable View' },
  { id: 'net-sheet', label: 'Net Sheet' },
  { id: 'phone-email-lookup', label: 'Phone And Email Look Up' },
  { id: 'new-append-farm', label: 'New/Append Farm' },
  { id: 'nearby-neighbors', label: 'Nearby Neighbors' },
  { id: 'create-note', label: 'Create a New Note' }
];

export function resolveDetailPropertyRowActions(): DataTableRowAction[] {
  return DETAIL_PROPERTY_ACTION_DEFINITIONS.map((action) => ({
    id: action.id,
    label: action.label
  }));
}
