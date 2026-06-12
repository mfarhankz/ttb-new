import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { WalletService } from '@app/features/payment/services/wallet.service';
import { PayNowModalService } from '@app/features/payment/services/pay-now-modal.service';
import { ButtonComponent, CardComponent } from '@app/shared/components';

@Component({
  selector: 'app-wallet-balance-card',
  standalone: true,
  imports: [CurrencyPipe, CardComponent, ButtonComponent],
  templateUrl: './wallet-balance-card.component.html',
  host: {
    class: 'block h-full min-h-0'
  }
})
export class WalletBalanceCardComponent {
  private readonly verticalService = inject(VerticalService);
  private readonly walletService = inject(WalletService);
  private readonly payNowModalService = inject(PayNowModalService);
  private readonly sessionExpiredService = inject(SessionExpiredService);

  readonly walletEnabled = computed(
    () => this.verticalService.content()?.app_config?.support_wallet !== false
  );
  readonly balance = this.walletService.balance;
  readonly walletLoading = this.walletService.loading;
  readonly walletError = this.walletService.error;

  constructor() {
    effect(() => {
      this.sessionExpiredService.sessionRenewed();

      if (this.walletEnabled()) {
        this.walletService.fetchBalance();
      }
    });
  }

  refreshBalance(): void {
    this.walletService.fetchBalance(true);
  }

  buyCredit(): void {
    this.payNowModalService
      .open({ mode: 'creditRecharge' })
      .subscribe(() => this.walletService.fetchBalance(true));
  }
}
