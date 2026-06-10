export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  action?: 'logout' | 'property-search' | 'theme';
  badge?: string;
  children?: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-map', route: '/dashboard' },
  { label: 'Property Search', icon: 'pi pi-search', action: 'property-search' },
  {
    label: 'Farming',
    icon: 'pi pi-sitemap',
    children: [
      { label: 'Radius search', icon: 'pi pi-circle', route: '/farming/radius-search' },
      { label: 'Boundary search', icon: 'pi pi-stop', route: '/farming/boundary-search' },
      { label: 'Area Search', icon: 'pi pi-sliders-h', route: '/farming/area-search' },
      { label: 'Saved Farms', icon: 'pi pi-bookmark', route: '/farming/saved-farms' },
      { label: 'Saved Searches', icon: 'pi pi-search-plus', route: '/farming/saved-searches' },
      { label: 'Saved Net Sheets', icon: 'pi pi-file-edit', route: '/farming/saved-net-sheets' }
    ]
  },
  { label: 'Statistics', icon: 'pi pi-chart-bar', route: '/statistics' },
  { label: 'Buyer Cost Estimate', icon: 'pi pi-calculator', route: '/buyer-cost-estimate' },
  { label: 'Daily Lead Alerts', icon: 'pi pi-bell', route: '/daily-lead-alerts', badge: 'NEW' },
  { label: 'High Volume Search', icon: 'pi pi-compass' },
  { label: '123 search', icon: 'pi pi-sort-numeric-down' }
];

export const MANAGE_ACCOUNT_NAV: NavItem[] = [
  { label: 'Account Information', icon: 'pi pi-id-card', route: '/manage-account/account-information' },
  { label: 'Download History', icon: 'pi pi-download', route: '/manage-account/download-history' },
  { label: 'Purchase History', icon: 'pi pi-receipt', route: '/manage-account/purchase-history' }
];

export const DASHBOARD_SECTION_NAV: NavItem[] = [
  { label: 'Admin', icon: 'pi pi-shield' },
  { label: 'Manage Reports', icon: 'pi pi-file' },
  { label: 'Manage Account', icon: 'pi pi-user' }
];

/** Base admin tabs; Agencies/Offices visibility is resolved in AdminPermissionsService. */
export const ADMIN_USERS_TAB: NavItem = { label: 'Users', icon: 'pi pi-users', route: '/admin/users' };
export const ADMIN_AGENCIES_TAB: NavItem = { label: 'Agencies', icon: 'pi pi-sitemap', route: '/admin/agencies' };
export const ADMIN_OFFICES_TAB: NavItem = { label: 'Offices', icon: 'pi pi-building', route: '/admin/offices' };

export const ADMIN_NAV: NavItem[] = [
  {
    label: 'Admin',
    icon: 'pi pi-shield',
    children: [ADMIN_USERS_TAB, ADMIN_OFFICES_TAB]
  },
  {
    label: 'Manage Reports',
    icon: 'pi pi-file',
    children: [
      { label: 'Order History', icon: 'pi pi-history', route: '/manage-reports/order-history' }
    ]
  }
];

export const SETTINGS_NAV: NavItem[] = [
  { label: 'Theme', icon: 'pi pi-palette', action: 'theme' },
  { label: 'Logout', icon: 'pi pi-sign-out', action: 'logout' }
];

export const SIDEBAR_COLLAPSED_KEY = 'ttb_sidebar_collapsed';
