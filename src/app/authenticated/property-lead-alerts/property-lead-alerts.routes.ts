import { Routes } from '@angular/router';

export const propertyLeadAlertsRoutes: Routes = [
  {
    path: 'property-lead-alerts',
    loadComponent: () =>
      import('@app/authenticated/property-lead-alerts/pages/property-lead-alerts.component').then(
        (m) => m.PropertyLeadAlertsComponent
      ),
    title: 'Property Lead Alerts'
  },
  {
    path: 'property-lead-alerts/history',
    loadComponent: () =>
      import('@app/authenticated/property-lead-alerts/pages/property-lead-alerts-history.component').then(
        (m) => m.PropertyLeadAlertsHistoryComponent
      ),
    title: 'PLA History'
  },
  {
    path: 'daily-lead-alerts',
    redirectTo: 'property-lead-alerts',
    pathMatch: 'full'
  }
];
