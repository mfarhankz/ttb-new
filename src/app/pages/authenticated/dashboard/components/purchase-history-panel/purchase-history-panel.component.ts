import { Component, effect, inject } from '@angular/core';
import { AuthService } from '../../../../../core/services/auth.service';
import { PurchaseHistoryService } from '../../../../../core/services/purchase-history.service';
import { DataTableComponent } from '../../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-purchase-history-panel',
  standalone: true,
  imports: [DataTableComponent],
  templateUrl: './purchase-history-panel.component.html'
})
export class PurchaseHistoryPanelComponent {
  private readonly authService = inject(AuthService);
  private readonly purchaseHistoryService = inject(PurchaseHistoryService);

  readonly columns = this.purchaseHistoryService.columns;
  readonly rows = this.purchaseHistoryService.rows;
  readonly loading = this.purchaseHistoryService.loading;
  readonly error = this.purchaseHistoryService.error;

  constructor() {
    effect(() => {
      if (this.authService.getUserId() != null) {
        this.purchaseHistoryService.fetchPurchaseHistory();
      }
    });
  }
}
