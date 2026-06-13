import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VERTICAL_CONFIG } from '@app/core/config/vertical.config';
import { AccountSettingsService } from '@app/authenticated/dashboard/services/account-settings.service';
import { AuthService } from '@app/core/services/auth.service';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { VerticalService } from '@app/core/services/vertical.service';
import {
  AlertComponent,
  ButtonComponent,
  CardComponent,
  ToggleComponent
} from '@app/shared/components';

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
  private readonly verticalService = inject(VerticalService);

  readonly isEndUser = computed(() => this.authService.isEndUser());
  readonly showNeedHelp = computed(
    () => !this.verticalService.content()?.custom_content?.user_home?.need_help_hide
  );
  readonly supportPhone = computed(() => {
    const support = this.verticalService.content()?.support_info;
    const userType = Number(this.authService.tbUser()?.type ?? 0);

    if (userType > 1) {
      return (
        support?.technical_support ||
        support?.help_desk_phone ||
        VERTICAL_CONFIG.defaultSupportPhone
      );
    }

    return (
      support?.help_desk_phone ||
      support?.technical_support ||
      VERTICAL_CONFIG.defaultSupportPhone
    );
  });
  readonly supportPhoneTel = computed(() => this.supportPhone().replace(/[^\d+]/g, ''));
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
