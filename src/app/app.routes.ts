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
        path: 'profile',
        loadComponent: () => import('./pages/authenticated/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Profile'
      }
    ]
  },
  // Redirect unknown routes
  {
    path: '**',
    redirectTo: ''
  }
];
