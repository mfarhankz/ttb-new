import { Routes } from '@angular/router';
import { publicGuard } from '@app/core/guards/auth.guard';

export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('@app/pages/public/home/home.component').then((m) => m.HomeComponent),
    title: 'Home'
  },
  {
    path: 'login',
    loadComponent: () => import('@app/pages/public/login/login.component').then((m) => m.LoginComponent),
    canActivate: [publicGuard],
    title: 'Login'
  }
];
