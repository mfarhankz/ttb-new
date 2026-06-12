export type AdminOfficeToolbarActionId = 'add-office' | 'advanced-search' | 'reset-default';

export interface AdminOfficeToolbarAction {
  id: AdminOfficeToolbarActionId;
  label: string;
  variant: 'primary' | 'danger';
  icon: string;
}

export function getAdminOfficeToolbarActions(entityLabel: 'Office' | 'Agency'): AdminOfficeToolbarAction[] {
  return [
    { id: 'add-office', label: `Add New ${entityLabel}`, variant: 'primary', icon: 'pi pi-plus' },
    { id: 'advanced-search', label: 'Advanced Search', variant: 'primary', icon: 'pi pi-search-plus' },
    { id: 'reset-default', label: 'Reset Default', variant: 'danger', icon: 'pi pi-replay' }
  ];
}
