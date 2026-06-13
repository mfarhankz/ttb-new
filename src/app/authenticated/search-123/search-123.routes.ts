import { Routes } from '@angular/router';

export const search123Routes: Routes = [
  {
    path: '123-search',
    loadComponent: () =>
      import('@app/authenticated/search-123/pages/search-123.component').then((m) => m.Search123Component),
    title: 'Steps'
  }
];
