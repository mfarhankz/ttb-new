import { Component, inject } from '@angular/core';
import { PayNowModalService } from '@app/features/payment/services/pay-now-modal.service';
import { PayNowModalComponent } from './pay-now-modal.component';

@Component({
  selector: 'app-pay-now-host',
  standalone: true,
  imports: [PayNowModalComponent],
  template: `
    @if (payNowModalService.activeOptions(); as options) {
      <app-pay-now-modal [options]="options" />
    }
  `
})
export class PayNowHostComponent {
  readonly payNowModalService = inject(PayNowModalService);
}
