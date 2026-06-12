import { Routes } from '@angular/router';
import { adminAgenciesGuard, adminOfficesGuard } from '@app/core/guards/admin-route.guard';

export const adminRoutes: Routes = [
  {
    path: 'admin',
    redirectTo: 'admin/users',
    pathMatch: 'full'
  },
  {
    path: 'admin/users',
    loadComponent: () =>
      import('@app/features/admin/pages/admin-users.component').then((m) => m.AdminUsersComponent),
    title: 'Users'
  },
  {
    path: 'admin/agencies',
    canActivate: [adminAgenciesGuard],
    loadComponent: () =>
      import('@app/features/admin/pages/admin-agencies.component').then((m) => m.AdminAgenciesComponent),
    title: 'Agencies'
  },
  {
    path: 'admin/offices',
    canActivate: [adminOfficesGuard],
    loadComponent: () =>
      import('@app/features/admin/pages/admin-offices.component').then((m) => m.AdminOfficesComponent),
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
      import('@app/features/admin/pages/manage-reports-order-history.component').then(
        (m) => m.ManageReportsOrderHistoryComponent
      ),
    title: 'Order History'
  }
];
