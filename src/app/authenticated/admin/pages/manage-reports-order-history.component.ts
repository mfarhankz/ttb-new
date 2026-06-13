import { Component } from '@angular/core';
import { OrderHistoryPanelComponent } from '@app/authenticated/dashboard/components/order-history-panel/order-history-panel.component';

@Component({
  selector: 'app-manage-reports-order-history',
  standalone: true,
  imports: [OrderHistoryPanelComponent],
  template: `
    <div class="p-8">
      <div class="mb-6">
        <h1 class="text-h2 font-bold text-foreground">Order History</h1>
        <p class="mt-2 text-muted">View past report orders.</p>
      </div>
      <app-order-history-panel />
    </div>
  `
})
export class ManageReportsOrderHistoryComponent {}
