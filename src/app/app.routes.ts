import { Routes } from '@angular/router';
import { adminAgenciesGuard, adminOfficesGuard } from './core/guards/admin-route.guard';
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
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'farming',
        redirectTo: 'farming/radius-search',
        pathMatch: 'full'
      },
      {
        path: 'farming/saved-farms',
        loadComponent: () =>
          import('./pages/authenticated/farming/saved-farms/saved-farms.component').then(m => m.SavedFarmsComponent),
        title: 'Saved Farms'
      },
      {
        path: 'farming/saved-searches',
        loadComponent: () =>
          import('./pages/authenticated/farming/saved-searches/saved-searches.component').then(
            m => m.SavedSearchesComponent
          ),
        title: 'Saved Searches'
      },
      {
        path: 'farming/saved-net-sheets',
        loadComponent: () =>
          import('./pages/authenticated/farming/saved-net-sheets/saved-net-sheets.component').then(
            m => m.SavedNetSheetsComponent
          ),
        title: 'Saved Net Sheets'
      },
      {
        path: 'farming/area-search',
        loadComponent: () =>
          import('./pages/authenticated/farming/area-search/area-search.component').then(
            m => m.AreaSearchComponent
          ),
        title: 'Area Search'
      },
      {
        path: 'detail/:source/:sourceId',
        loadComponent: () =>
          import('./pages/authenticated/detail/detail-page.component').then(m => m.DetailPageComponent),
        title: 'Detail'
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
        redirectTo: 'statistics/radius-search',
        pathMatch: 'full'
      },
      {
        path: 'statistics/radius-search',
        loadComponent: () => import('./pages/authenticated/farming/farming.component').then(m => m.FarmingComponent),
        title: 'Statistics Radius search',
        data: { mapMode: 'radius', searchContext: 'statistics' }
      },
      {
        path: 'statistics/boundary-search',
        loadComponent: () => import('./pages/authenticated/farming/farming.component').then(m => m.FarmingComponent),
        title: 'Statistics Boundary search',
        data: { mapMode: 'boundary', searchContext: 'statistics' }
      },
      {
        path: 'statistics/area-search',
        loadComponent: () =>
          import('./pages/authenticated/statistics/stats-area-search/stats-area-search.component').then(
            m => m.StatsAreaSearchComponent
          ),
        title: 'Statistics Area Search'
      },
      {
        path: 'buyer-cost-estimate',
        loadComponent: () =>
          import('./pages/authenticated/buyer-cost-estimate/buyer-cost-estimate.component').then(
            (m) => m.BuyerCostEstimateComponent
          ),
        title: 'Buyer Cost Estimate'
      },
      {
        path: 'property-lead-alerts',
        loadComponent: () =>
          import('./pages/authenticated/property-lead-alerts/property-lead-alerts.component').then(
            (m) => m.PropertyLeadAlertsComponent
          ),
        title: 'Property Lead Alerts'
      },
      {
        path: 'property-lead-alerts/history',
        loadComponent: () =>
          import('./pages/authenticated/property-lead-alerts/property-lead-alerts-history.component').then(
            (m) => m.PropertyLeadAlertsHistoryComponent
          ),
        title: 'PLA History'
      },
      {
        path: 'daily-lead-alerts',
        redirectTo: 'property-lead-alerts',
        pathMatch: 'full'
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
        path: 'admin/agencies',
        canActivate: [adminAgenciesGuard],
        loadComponent: () =>
          import('./pages/authenticated/admin/admin-agencies.component').then(m => m.AdminAgenciesComponent),
        title: 'Agencies'
      },
      {
        path: 'admin/offices',
        canActivate: [adminOfficesGuard],
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
      }
    ]
  },
  // Redirect unknown routes
  {
    path: '**',
    redirectTo: ''
  }
];
