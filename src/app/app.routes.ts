import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes (before login)
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/public/home/home.component').then(m => m.HomeComponent),
        title: 'Home'
      },
      {
        path: 'login',
        loadComponent: () => import('./pages/public/login/login.component').then(m => m.LoginComponent),
        canActivate: [publicGuard],
        title: 'Login'
      }
    ]
  },
  // Authenticated routes (after login)
  {
    path: '',
    loadComponent: () => import('./layouts/authenticated-layout/authenticated-layout.component').then(m => m.AuthenticatedLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/authenticated/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard'
      },
      {
        path: 'property-search',
        loadComponent: () => import('./pages/authenticated/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        title: 'Property Search'
      },
      {
        path: 'farming',
        redirectTo: 'farming/radius-search',
        pathMatch: 'full'
      },
      {
        path: 'farming/radius-search',
        loadComponent: () => import('./pages/authenticated/farming/farming.component').then(m => m.FarmingComponent),
        title: 'Radius search',
        data: { mapMode: 'radius' }
      },
      {
        path: 'farming/boundary-search',
        loadComponent: () => import('./pages/authenticated/farming/farming.component').then(m => m.FarmingComponent),
        title: 'Boundary search',
        data: { mapMode: 'boundary' }
      },
      {
        path: 'statistics',
        loadComponent: () => import('./pages/authenticated/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        title: 'Statistics'
      },
      {
        path: 'buyer-cost-estimate',
        loadComponent: () => import('./pages/authenticated/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        title: 'Buyer Cost Estimate'
      },
      {
        path: 'daily-lead-alerts',
        loadComponent: () => import('./pages/authenticated/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
        title: 'Daily Lead Alerts'
      },
      {
        path: 'admin',
        redirectTo: 'admin/users',
        pathMatch: 'full'
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./pages/authenticated/admin/admin-users.component').then(m => m.AdminUsersComponent),
        title: 'Users'
      },
      {
        path: 'admin/offices',
        loadComponent: () => import('./pages/authenticated/admin/admin-offices.component').then(m => m.AdminOfficesComponent),
        title: 'Offices'
      },
      {
        path: 'manage-reports',
        redirectTo: 'manage-reports/order-history',
        pathMatch: 'full'
      },
      {
        path: 'manage-reports/order-history',
        loadComponent: () =>
          import('./pages/authenticated/admin/manage-reports-order-history.component').then(
            m => m.ManageReportsOrderHistoryComponent
          ),
        title: 'Order History'
      },
      {
        path: 'manage-account',
        redirectTo: 'manage-account/account-information',
        pathMatch: 'full'
      },
      {
        path: 'manage-account/account-information',
        loadComponent: () =>
          import('./pages/authenticated/manage-account/account-information.component').then(
            m => m.AccountInformationComponent
          ),
        title: 'Account Information'
      },
      {
        path: 'manage-account/account-settings',
        loadComponent: () =>
          import('./pages/authenticated/manage-account/account-settings.component').then(
            m => m.AccountSettingsComponent
          ),
        title: 'Account Settings'
      },
      {
        path: 'manage-account/download-history',
        loadComponent: () =>
          import('./pages/authenticated/manage-account/download-history.component').then(
            m => m.DownloadHistoryComponent
          ),
        title: 'Download History'
      },
      {
        path: 'manage-account/purchase-history',
        loadComponent: () =>
          import('./pages/authenticated/manage-account/purchase-history.component').then(
            m => m.PurchaseHistoryComponent
          ),
        title: 'Purchase History'
      },
      {
        path: 'manage-account/wallet',
        loadComponent: () =>
          import('./pages/authenticated/manage-account/wallet.component').then(m => m.WalletComponent),
        title: 'Wallet'
      },
      {
        path: 'manage-account/subscription',
        loadComponent: () =>
          import('./pages/authenticated/manage-account/subscription.component').then(
            m => m.SubscriptionComponent
          ),
        title: 'Subscription'
      }
    ]
  },
  // Redirect unknown routes
  {
    path: '**',
    redirectTo: ''
  }
];
