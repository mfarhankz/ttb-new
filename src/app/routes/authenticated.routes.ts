import { Routes } from '@angular/router';
import { authGuard } from '@app/core/guards/auth.guard';
import { adminRoutes } from '@app/features/admin/admin.routes';
import { buyerCostEstimateRoutes } from '@app/features/buyer-cost-estimate/buyer-cost-estimate.routes';
import { dashboardRoutes } from '@app/features/dashboard/dashboard.routes';
import { detailRoutes } from '@app/features/detail/detail.routes';
import { farmingRoutes } from '@app/features/farming/farming.routes';
import { propertyLeadAlertsRoutes } from '@app/features/property-lead-alerts/property-lead-alerts.routes';
import { statisticsRoutes } from '@app/features/statistics/statistics.routes';

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
      ...adminRoutes
    ]
  }
];
