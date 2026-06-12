import { Routes } from '@angular/router';
import { authenticatedRoutes } from '@app/routes/authenticated.routes';
import { publicRoutes } from '@app/routes/public.routes';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@app/layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: publicRoutes
  },
  ...authenticatedRoutes,
  {
    path: '**',
    redirectTo: ''
  }
];
