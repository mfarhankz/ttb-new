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
  icon: string;
}

export function getAdminUserToolbarActions(options: {
  addUserAllowed: boolean;
  uploadUserAllowed: boolean;
}): AdminUserToolbarAction[] {
  const actions: AdminUserToolbarAction[] = [];

  if (options.addUserAllowed) {
    actions.push({ id: 'add-user', label: 'Add New User', variant: 'primary', icon: 'pi pi-user-plus' });
  }

  if (options.uploadUserAllowed) {
    actions.push({ id: 'upload-user', label: 'Upload User', variant: 'primary', icon: 'pi pi-upload' });
  }

  actions.push(
    { id: 'advanced-export', label: 'Advanced Export', variant: 'primary', icon: 'pi pi-file-export' },
    { id: 'export', label: 'Export', variant: 'primary', icon: 'pi pi-download' },
    { id: 'advanced-search', label: 'Advanced Search', variant: 'primary', icon: 'pi pi-search-plus' },
    { id: 'reset-default', label: 'Reset Default', variant: 'danger', icon: 'pi pi-replay' }
  );

  return actions;
}
