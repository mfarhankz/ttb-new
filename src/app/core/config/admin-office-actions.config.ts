import { AdminOfficeRecord } from '../interfaces/admin-offices.interface';
import { DataTableRowAction } from '@app/shared/components/data-table/data-table.types';

export interface AdminOfficeActionContext {
  isAgenciesTabAllowed: boolean;
}

export interface AdminOfficeActionDefinition {
  id: string;
  label: string;
  isAllowed?: (record: AdminOfficeRecord, ctx: AdminOfficeActionContext) => boolean;
}

export const ADMIN_OFFICE_ACTION_DEFINITIONS: AdminOfficeActionDefinition[] = [
  { id: 'edit', label: 'Edit' },
  {
    id: 'set-target-office',
    label: 'Set as Target Office',
    isAllowed: (_, ctx) => !ctx.isAgenciesTabAllowed
  },
  { id: 'upload-users', label: 'Upload Users' }
];

export function resolveAdminOfficeRowActions(
  record: AdminOfficeRecord,
  ctx: AdminOfficeActionContext
): DataTableRowAction[] {
  return ADMIN_OFFICE_ACTION_DEFINITIONS.filter(
    (action) => !action.isAllowed || action.isAllowed(record, ctx)
  ).map((action) => ({
    id: action.id,
    label: action.label
  }));
}
