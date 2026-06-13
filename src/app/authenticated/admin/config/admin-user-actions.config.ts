import { AdminUserRecord } from '@app/core/interfaces/admin-users.interface';
import { DataTableRowAction } from '@app/shared/ui/data-table/data-table.types';

export interface AdminUserActionContext {
  loggedInUserType: number;
  loggedInUserId: number | string | null;
  isOfficeTabAllowed: boolean;
  isInvestorsVertical: boolean;
  appConfig: Record<string, unknown>;
}

export interface AdminUserActionDefinition {
  id: string;
  label: string;
  isAllowed?: (record: AdminUserRecord, ctx: AdminUserActionContext) => boolean;
}

export const ADMIN_USER_ACTION_DEFINITIONS: AdminUserActionDefinition[] = [
  { id: 'edit-view', label: 'Edit/View', isAllowed: (_, ctx) => !ctx.appConfig['disable_edit_user'] },
  {
    id: 'rea-stats',
    label: 'REA Stats',
    isAllowed: (record, ctx) =>
      !!record.user_col?.license_number && ctx.appConfig['REA_report'] !== false
  },
  { id: 'view-usage', label: 'View Usage' },
  {
    id: 'add-to-marketing',
    label: 'Add to Marketing',
    isAllowed: (record, ctx) =>
      String(record.name_col?.type) === '1' &&
      String(record.user_col?.is_assigned) === '1' &&
      ctx.loggedInUserId != null &&
      String(record.user_col?.parent_user_id) === String(ctx.loggedInUserId)
  },
  {
    id: 'billing-information',
    label: 'Billing Information',
    isAllowed: (record, ctx) =>
      !!ctx.appConfig['enable_billing'] ||
      !!record.user_col?.username?.toLowerCase().includes('investor')
  },
  {
    id: 'resend-welcome-email',
    label: 'Resend Welcome Email',
    isAllowed: (_, ctx) => !ctx.appConfig['disable_resend_welcome_email']
  },
  {
    id: 'view-assigned-users',
    label: 'View Assigned users',
    isAllowed: (record, ctx) =>
      ctx.loggedInUserType !== 2 && String(record.name_col?.type) === '2'
  },
  {
    id: 'associate-to-rep',
    label: 'associate to Rep',
    isAllowed: (record, ctx) =>
      ctx.loggedInUserType !== 2 && String(record.name_col?.type) === '1'
  },
  {
    id: 'associate-to-manager',
    label: 'associate to Manager',
    isAllowed: (record, ctx) =>
      ctx.loggedInUserType !== 2 && String(record.name_col?.type) === '2'
  },
  {
    id: 'associate-to-office',
    label: 'associate to Office',
    isAllowed: (record, ctx) => {
      const type = String(record.name_col?.type ?? '');
      return (
        ctx.isOfficeTabAllowed &&
        (Number(type) <= 3 || type === '5')
      );
    }
  },
  { id: 'view-edit-limits', label: 'View/Edit Limits' },
  {
    id: 'view-edit-grantable-limits',
    label: 'View/Edit Grantable Limits',
    isAllowed: (record, ctx) =>
      ctx.loggedInUserType !== 2 && Number(record.name_col?.type ?? 0) >= 2
  },
  {
    id: 'subscribe',
    label: 'Subscribe',
    isAllowed: (record, ctx) =>
      ctx.isInvestorsVertical && record.name_col?.subscription_status === 0
  }
];

export function resolveAdminUserRowActions(
  record: AdminUserRecord,
  ctx: AdminUserActionContext
): DataTableRowAction[] {
  return ADMIN_USER_ACTION_DEFINITIONS.filter(
    (action) => !action.isAllowed || action.isAllowed(record, ctx)
  ).map((action) => ({
    id: action.id,
    label: action.label
  }));
}
