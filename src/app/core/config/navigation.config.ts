export interface NavItem {
  label: string;
  icon: string;
  route?: string;
  action?: 'logout';
  badge?: string;
  children?: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-map', route: '/dashboard' },
  { label: 'Property Search', icon: 'pi pi-search', route: '/property-search' },
  {
    label: 'Farming',
    icon: 'pi pi-sitemap',
    children: [
      { label: 'Radius search', icon: 'pi pi-circle', route: '/farming/radius-search' },
      { label: 'Boundary search', icon: 'pi pi-stop', route: '/farming/boundary-search' }
    ]
  },
  { label: 'Statistics', icon: 'pi pi-chart-bar', route: '/statistics' },
  { label: 'Buyer Cost Estimate', icon: 'pi pi-calculator', route: '/buyer-cost-estimate' },
  { label: 'Daily Lead Alerts', icon: 'pi pi-bell', route: '/daily-lead-alerts', badge: 'NEW' }
];

export const ADMIN_NAV: NavItem[] = [
  { label: 'Admin', icon: 'pi pi-shield', route: '/admin' },
  { label: 'Manage Reports', icon: 'pi pi-file', route: '/manage-reports' },
  { label: 'Manage Account', icon: 'pi pi-user', route: '/manage-account' }
];

export const SETTINGS_NAV: NavItem[] = [
  { label: 'Logout', icon: 'pi pi-sign-out', action: 'logout' }
];

export const SIDEBAR_COLLAPSED_KEY = 'ttb_sidebar_collapsed';
