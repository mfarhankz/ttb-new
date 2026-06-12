import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  TtbSaveUserSettingsResponse,
  TtbUserSettingsResponse,
  UserNotificationSettings
} from '@app/core/interfaces/api.interface';
import { ApiService } from '@app/core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AccountSettingsService {
  private readonly apiService = inject(ApiService);

  private readonly _settings = signal<UserNotificationSettings>({
    farm_email_notification_enabled: false,
    bcc_on_notification_suppressed: false
  });
  private readonly _savedSettings = signal<UserNotificationSettings>({
    farm_email_notification_enabled: false,
    bcc_on_notification_suppressed: false
  });
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly settings = this._settings.asReadonly();
  readonly savedSettings = this._savedSettings.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  private loadSucceeded = false;

  invalidateCache(): void {
    this.loadSucceeded = false;
  }

  fetchSettings(force = false): void {
    if (!force && this.loadSucceeded) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.apiService.get<TtbUserSettingsResponse>(API_CONFIG.endpoints.getUserSettings).subscribe({
      next: (res) => {
        const normalized = this.normalizeSettings(res.effective_user_settings?.notification);
        this._settings.set(normalized);
        this._savedSettings.set({ ...normalized });
        this.loadSucceeded = true;
        this._loading.set(false);
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load account settings.');
        this._loading.set(false);
      }
    });
  }

  updateSetting<K extends keyof UserNotificationSettings>(
    key: K,
    value: UserNotificationSettings[K]
  ): void {
    this._settings.update((current) => ({ ...current, [key]: value }));
  }

  resetSettings(): void {
    this._settings.set({ ...this._savedSettings() });
  }

  saveSettings(userId: number | string): Observable<void> {
    this._saving.set(true);
    this._error.set(null);

    const payload = {
      user_settings: {
        farm_email_notification_enabled: this._settings().farm_email_notification_enabled ? 1 : 0,
        bcc_on_notification_suppressed: this._settings().bcc_on_notification_suppressed ? 1 : 0
      },
      user_id: userId
    };

    return this.apiService.post<TtbSaveUserSettingsResponse>(API_CONFIG.endpoints.saveUserSettings, payload).pipe(
      map((res) => {
        if (res.response?.status !== 'OK') {
          throw new Error(
            (Array.isArray(res.response?.data) ? res.response.data[0] : undefined) ??
              'Failed to save account settings.'
          );
        }

        const saved = { ...this._settings() };
        this._savedSettings.set(saved);
        this._saving.set(false);
      }),
      catchError((err) => {
        this._saving.set(false);
        this._error.set(err.message ?? 'Failed to save account settings.');
        return throwError(() => err);
      })
    );
  }

  private normalizeSettings(notification?: {
    farm_email_notification_enabled?: number | boolean;
    bcc_on_notification_suppressed?: number | boolean;
  }): UserNotificationSettings {
    return {
      farm_email_notification_enabled: this.toBoolean(notification?.farm_email_notification_enabled),
      bcc_on_notification_suppressed: this.toBoolean(notification?.bcc_on_notification_suppressed)
    };
  }

  private toBoolean(value?: number | boolean): boolean {
    return value === true || value === 1;
  }
}
