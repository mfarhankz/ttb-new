import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccountSettingsService } from '../../../../../core/services/account-settings.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { SessionExpiredService } from '../../../../../core/services/session-expired.service';
import {
  AlertComponent,
  ButtonComponent,
  CardComponent,
  ToggleComponent
} from '../../../../../shared/components';

@Component({
  selector: 'app-account-settings-card',
  standalone: true,
  imports: [FormsModule, CardComponent, ToggleComponent, ButtonComponent, AlertComponent],
  templateUrl: './account-settings-card.component.html',
  host: {
    class: 'block h-full min-h-0'
  }
})
export class AccountSettingsCardComponent {
  private readonly authService = inject(AuthService);
  private readonly accountSettingsService = inject(AccountSettingsService);
  private readonly sessionExpiredService = inject(SessionExpiredService);

  readonly isEndUser = computed(() => this.authService.isEndUser());
  readonly settings = this.accountSettingsService.settings;
  readonly loading = this.accountSettingsService.loading;
  readonly saving = this.accountSettingsService.saving;
  readonly fetchError = this.accountSettingsService.error;

  readonly statusType = signal<'success' | 'error' | ''>('');
  readonly statusMessage = signal('');

  constructor() {
    effect(() => {
      this.sessionExpiredService.sessionRenewed();

      const userId = this.authService.getUserId();
      if (userId != null) {
        this.accountSettingsService.fetchSettings();
      }
    });
  }

  onFarmEmailChange(checked: boolean): void {
    this.accountSettingsService.updateSetting('farm_email_notification_enabled', checked);
  }

  onBccSuppressChange(checked: boolean): void {
    this.accountSettingsService.updateSetting('bcc_on_notification_suppressed', checked);
  }

  resetSettings(): void {
    this.accountSettingsService.resetSettings();
    this.clearStatus();
  }

  updateSettings(): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      return;
    }

    this.clearStatus();
    this.accountSettingsService.saveSettings(userId).subscribe({
      next: () => {
        this.statusType.set('success');
        this.statusMessage.set('Your settings have been saved successfully.');
        setTimeout(() => this.clearStatus(), 2500);
      },
      error: () => {
        this.statusType.set('error');
        this.statusMessage.set(this.fetchError() ?? 'Failed to save account settings.');
      }
    });
  }

  private clearStatus(): void {
    this.statusType.set('');
    this.statusMessage.set('');
  }
}
