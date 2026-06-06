import { Component } from '@angular/core';

@Component({
  selector: 'app-manage-reports-order-history',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Order History</h1>
      <p class="mt-2 text-muted">View and search past report orders.</p>
    </div>
  `
})
export class ManageReportsOrderHistoryComponent {}
