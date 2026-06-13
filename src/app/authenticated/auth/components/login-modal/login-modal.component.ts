import { Component, effect, inject, viewChild } from '@angular/core';
import { ModalComponent } from '@app/shared/ui/modal/modal.component';
import { LoginComponent } from '@app/public/login/login.component';
import { AdminUsersService } from '@app/authenticated/admin/services/admin-users.service';
import { AccountInformationService } from '@app/authenticated/dashboard/services/account-information.service';
import { AccountSettingsService } from '@app/authenticated/dashboard/services/account-settings.service';
import { OrderHistoryService } from '@app/authenticated/dashboard/services/order-history.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { SubscriptionService } from '@app/authenticated/dashboard/services/subscription.service';
import { WalletService } from '@app/authenticated/payment/services/wallet.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [ModalComponent, LoginComponent],
  templateUrl: './login-modal.component.html'
})
export class LoginModalComponent {
  readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly walletService = inject(WalletService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly accountSettingsService = inject(AccountSettingsService);
  private readonly adminUsersService = inject(AdminUsersService);
  private readonly accountInformationService = inject(AccountInformationService);
  private readonly orderHistoryService = inject(OrderHistoryService);
  private readonly modal = viewChild.required<ModalComponent>('modal');

  constructor() {
    effect(() => {
      const modal = this.modal();
      if (!modal) {
        return;
      }

      if (this.sessionExpiredService.loginModalOpen()) {
        modal.open();
      } else if (modal.isOpen()) {
        modal.close();
      }
    });
  }

  onLoginSuccess(): void {
    this.walletService.invalidateCache();
    this.subscriptionService.invalidateCache();
    this.accountSettingsService.invalidateCache();
    this.accountInformationService.clearCache();
    this.orderHistoryService.invalidateCache();
    this.adminUsersService.invalidateCache();
    this.sessionExpiredService.notifySessionRenewed();
    this.sessionExpiredService.closeLoginModal();
  }
}
