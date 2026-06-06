import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { API_CONFIG } from '../config/api.config';
import { TtbUserUsageResponse } from '../interfaces/api.interface';
import { UserUsageDetails } from '../interfaces/user-usage.interface';

@Injectable({ providedIn: 'root' })
export class UserUsageService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  private readonly _details = signal<UserUsageDetails | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly details = this._details.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  fetchUserUsage(): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this._error.set('Unable to determine current user.');
      return;
    }

    this._loading.set(true);
    this._error.set(null);
    this._details.set(null);

    this.apiService.get<TtbUserUsageResponse>(`${API_CONFIG.endpoints.userUsageReport}/${userId}.json`).subscribe({
      next: (response) => {
        const payload = response.response;

        if (payload.status !== 'OK') {
          this._error.set(payload.message ?? 'Failed to load download history.');
          this._loading.set(false);
          return;
        }

        this._details.set(payload.data ?? null);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set(err.message ?? 'Failed to load download history.');
        this._loading.set(false);
      }
    });
  }
}
