import { Component, effect, inject } from '@angular/core';
import { OrderHistoryService } from '@app/features/dashboard/services/order-history.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { DataTableComponent } from '@app/shared/ui/data-table/data-table.component';

@Component({
  selector: 'app-order-history-panel',
  standalone: true,
  imports: [DataTableComponent],
  templateUrl: './order-history-panel.component.html'
})
export class OrderHistoryPanelComponent {
  private readonly orderHistoryService = inject(OrderHistoryService);
  private readonly sessionExpiredService = inject(SessionExpiredService);

  readonly columns = this.orderHistoryService.columns;
  readonly rows = this.orderHistoryService.rows;
  readonly loading = this.orderHistoryService.loading;
  readonly error = this.orderHistoryService.error;

  constructor() {
    effect(() => {
      this.sessionExpiredService.sessionRenewed();
      this.orderHistoryService.fetchOrderHistory();
    });
  }
}
