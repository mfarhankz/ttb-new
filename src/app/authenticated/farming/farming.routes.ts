import { Routes } from '@angular/router';

export const farmingRoutes: Routes = [
  {
    path: 'farming',
    redirectTo: 'farming/radius-search',
    pathMatch: 'full'
  },
  {
    path: 'farming/saved-farms',
    loadComponent: () =>
      import('@app/authenticated/farming/pages/saved-farms/saved-farms.component').then((m) => m.SavedFarmsComponent),
    title: 'Saved Farms'
  },
  {
    path: 'farming/saved-searches',
    loadComponent: () =>
      import('@app/authenticated/farming/pages/saved-searches/saved-searches.component').then(
        (m) => m.SavedSearchesComponent
      ),
    title: 'Saved Searches'
  },
  {
    path: 'farming/saved-net-sheets',
    loadComponent: () =>
      import('@app/authenticated/farming/pages/saved-net-sheets/saved-net-sheets.component').then(
        (m) => m.SavedNetSheetsComponent
      ),
    title: 'Saved Net Sheets'
  },
  {
    path: 'farming/area-search',
    loadComponent: () =>
      import('@app/authenticated/farming/pages/area-search/area-search.component').then((m) => m.AreaSearchComponent),
    title: 'Area Search'
  },
  {
    path: 'farming/radius-search',
    loadComponent: () =>
      import('@app/authenticated/map/pages/map-search/map-search.component').then((m) => m.MapSearchComponent),
    title: 'Radius search',
    data: { mapMode: 'radius' }
  },
  {
    path: 'farming/boundary-search',
    loadComponent: () =>
      import('@app/authenticated/map/pages/map-search/map-search.component').then((m) => m.MapSearchComponent),
    title: 'Boundary search',
    data: { mapMode: 'boundary' }
  }
];
