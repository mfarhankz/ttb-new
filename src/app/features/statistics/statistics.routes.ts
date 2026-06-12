import { Routes } from '@angular/router';

export const statisticsRoutes: Routes = [
  {
    path: 'statistics',
    redirectTo: 'statistics/radius-search',
    pathMatch: 'full'
  },
  {
    path: 'statistics/radius-search',
    loadComponent: () =>
      import('@app/features/map/pages/map-search/map-search.component').then((m) => m.MapSearchComponent),
    title: 'Statistics Radius search',
    data: { mapMode: 'radius', searchContext: 'statistics' }
  },
  {
    path: 'statistics/boundary-search',
    loadComponent: () =>
      import('@app/features/map/pages/map-search/map-search.component').then((m) => m.MapSearchComponent),
    title: 'Statistics Boundary search',
    data: { mapMode: 'boundary', searchContext: 'statistics' }
  },
  {
    path: 'statistics/area-search',
    loadComponent: () =>
      import('@app/features/statistics/pages/stats-area-search/stats-area-search.component').then(
        (m) => m.StatsAreaSearchComponent
      ),
    title: 'Statistics Area Search'
  }
];
