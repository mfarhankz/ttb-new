import { MenuItem } from 'primeng/api';

/** Placeholder — wire offices tab actions when the offices pipeline is implemented. */
export function getAdminOfficeToolbarMenuItems(): MenuItem[] {
  return [
    { label: 'Add New Office', icon: 'pi pi-plus', disabled: true },
    { label: 'Export', icon: 'pi pi-download', disabled: true }
  ];
}
