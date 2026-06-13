import { Routes } from '@angular/router';

export const buyerCostEstimateRoutes: Routes = [
  {
    path: 'buyer-cost-estimate',
    loadComponent: () =>
      import('@app/authenticated/buyer-cost-estimate/pages/buyer-cost-estimate.component').then(
        (m) => m.BuyerCostEstimateComponent
      ),
    title: 'Buyer Cost Estimate'
  }
];
