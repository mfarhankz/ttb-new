import { Component } from '@angular/core';

@Component({
  selector: 'app-purchase-history',
  standalone: true,
  template: `
    <div class="p-8">
      <h1 class="text-h2 font-bold text-foreground">Purchase History</h1>
      <p class="mt-2 text-muted">Review your purchase and billing history.</p>
    </div>
  `
})
export class PurchaseHistoryComponent {}
