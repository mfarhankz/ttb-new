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
        loadComponent: () => import('./pages/authenticated/admin/admin.component').then(m => m.AdminComponent),
        title: 'Admin'
      },
      {
        path: 'manage-reports',
        loadComponent: () => import('./pages/authenticated/admin/manage-reports.component').then(m => m.ManageReportsComponent),
        title: 'Manage Reports'
      },
      {
        path: 'manage-account',
        loadComponent: () => import('./pages/authenticated/admin/manage-account.component').then(m => m.ManageAccountComponent),
        title: 'Manage Account'
      }
    ]
  },
  // Redirect unknown routes
  {
    path: '**',
    redirectTo: ''
  }
];
