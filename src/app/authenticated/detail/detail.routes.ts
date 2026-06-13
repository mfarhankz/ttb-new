import { Routes } from '@angular/router';

export const detailRoutes: Routes = [
  {
    path: 'detail/:source/:sourceId',
    loadComponent: () =>
      import('@app/authenticated/detail/pages/detail-page.component').then((m) => m.DetailPageComponent),
    title: 'Detail'
  }
];
