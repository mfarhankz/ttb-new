export type AdminUserToolbarActionId =
  | 'add-user'
  | 'upload-user'
  | 'advanced-export'
  | 'export'
  | 'advanced-search'
  | 'reset-default';

export interface AdminUserToolbarAction {
  id: AdminUserToolbarActionId;
  label: string;
  variant: 'primary' | 'danger';
}

export function getAdminUserToolbarActions(options: {
  addUserAllowed: boolean;
  uploadUserAllowed: boolean;
}): AdminUserToolbarAction[] {
  const actions: AdminUserToolbarAction[] = [];

  if (options.addUserAllowed) {
    actions.push({ id: 'add-user', label: 'Add New User', variant: 'primary' });
  }

  if (options.uploadUserAllowed) {
    actions.push({ id: 'upload-user', label: 'Upload User', variant: 'primary' });
  }

  actions.push(
    { id: 'advanced-export', label: 'Advanced Export', variant: 'primary' },
    { id: 'export', label: 'Export', variant: 'primary' },
    { id: 'advanced-search', label: 'Advanced Search', variant: 'primary' },
    { id: 'reset-default', label: 'Reset Default', variant: 'danger' }
  );

  return actions;
}
