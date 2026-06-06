import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { WalletBalanceCardComponent, SubscriptionCardComponent, AccountSettingsCardComponent } from './components';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WalletBalanceCardComponent, SubscriptionCardComponent, AccountSettingsCardComponent],
  templateUrl: './dashboard.component.html',
  styles: []
})
export class DashboardComponent {
  private readonly authService = inject(AuthService);

  readonly subscriptionExpanded = signal(false);
  readonly name = computed(() => this.authService.getUserName());
}
