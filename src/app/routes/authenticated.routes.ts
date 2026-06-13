import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth.guard';
import { adminRoutes } from '@app/authenticated/admin/admin.routes';
import { buyerCostEstimateRoutes } from '@app/authenticated/buyer-cost-estimate/buyer-cost-estimate.routes';
import { dashboardRoutes } from '@app/authenticated/dashboard/dashboard.routes';
import { detailRoutes } from '@app/authenticated/detail/detail.routes';
import { farmingRoutes } from '@app/authenticated/farming/farming.routes';
import { propertyLeadAlertsRoutes } from '@app/authenticated/property-lead-alerts/property-lead-alerts.routes';
import { search123Routes } from '@app/authenticated/search-123/search-123.routes';
import { statisticsRoutes } from '@app/authenticated/statistics/statistics.routes';

export const authenticatedRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@app/layouts/authenticated-layout/authenticated-layout.component').then(
        (m) => m.AuthenticatedLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      ...dashboardRoutes,
      ...farmingRoutes,
      ...detailRoutes,
      ...statisticsRoutes,
      ...buyerCostEstimateRoutes,
      ...propertyLeadAlertsRoutes,
      ...search123Routes,
      ...adminRoutes
    ]
  }
];
