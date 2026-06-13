import { Routes } from '@angular/router';

export const dashboardRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@app/authenticated/dashboard/pages/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard'
  },
  {
    path: 'property-search',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];
