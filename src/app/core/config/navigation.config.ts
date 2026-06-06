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
  { label: 'Daily Lead Alerts', icon: 'pi pi-bell', route: '/daily-lead-alerts', badge: 'NEW' },
  { label: 'High Volume Search', icon: 'pi pi-compass' },
  { label: '123 search', icon: 'pi pi-sort-numeric-down' }
];

export const ADMIN_NAV: NavItem[] = [
  {
    label: 'Admin',
    icon: 'pi pi-shield',
    children: [
      { label: 'Users', icon: 'pi pi-users', route: '/admin/users' },
      { label: 'Offices', icon: 'pi pi-building', route: '/admin/offices' }
    ]
  },
  {
    label: 'Manage Reports',
    icon: 'pi pi-file',
    children: [
      { label: 'Order History', icon: 'pi pi-history', route: '/manage-reports/order-history' }
    ]
  },
  {
    label: 'Manage Account',
    icon: 'pi pi-user',
    children: [
      { label: 'Account Information', icon: 'pi pi-id-card', route: '/manage-account/account-information' },
      { label: 'Account Settings', icon: 'pi pi-cog', route: '/manage-account/account-settings' },
      { label: 'Download History', icon: 'pi pi-download', route: '/manage-account/download-history' },
      { label: 'Purchase History', icon: 'pi pi-receipt', route: '/manage-account/purchase-history' },
      { label: 'Wallet', icon: 'pi pi-wallet', route: '/manage-account/wallet' },
      { label: 'Subscription', icon: 'pi pi-credit-card', route: '/manage-account/subscription' }
    ]
  }
];

export const SETTINGS_NAV: NavItem[] = [
  { label: 'Logout', icon: 'pi pi-sign-out', action: 'logout' }
];

export const SIDEBAR_COLLAPSED_KEY = 'ttb_sidebar_collapsed';
