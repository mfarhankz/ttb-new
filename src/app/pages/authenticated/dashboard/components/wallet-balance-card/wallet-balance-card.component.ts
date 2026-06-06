import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VerticalService } from '../../../../../core/services/vertical.service';
import { WalletService } from '../../../../../core/services/wallet.service';
import { ButtonComponent, CardComponent } from '../../../../../shared/components';

@Component({
  selector: 'app-wallet-balance-card',
  standalone: true,
  imports: [CurrencyPipe, CardComponent, ButtonComponent],
  templateUrl: './wallet-balance-card.component.html',
  host: {
    class: 'block h-full min-h-0'
  }
})
export class WalletBalanceCardComponent implements OnInit {
  private readonly verticalService = inject(VerticalService);
  private readonly walletService = inject(WalletService);
  private readonly router = inject(Router);

  readonly walletEnabled = computed(
    () => this.verticalService.content()?.app_config?.support_wallet !== false
  );
  readonly balance = this.walletService.balance;
  readonly walletLoading = this.walletService.loading;
  readonly walletError = this.walletService.error;

  ngOnInit(): void {
    if (this.walletEnabled()) {
      this.walletService.fetchBalance();
    }
  }

  refreshBalance(): void {
    this.walletService.fetchBalance();
  }

  goToWallet(): void {
    this.router.navigate(['/manage-account/wallet']);
  }
}
