import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../config/api.config';
import { TtbWalletResponse, WalletInfo } from '../interfaces/api.interface';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly apiService = inject(ApiService);

  private readonly _balance = signal<number | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly balance = this._balance.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private loadSucceeded = false;

  invalidateCache(): void {
    this.loadSucceeded = false;
  }

  fetchBalance(force = false): void {
    if (!force && this.loadSucceeded) {
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.apiService.get<TtbWalletResponse>(API_CONFIG.endpoints.getUserWallet).subscribe({
      next: (res) => {
        const response = res.response;

        if (response.status !== 'OK') {
          this.loadSucceeded = false;
          this._error.set(this.formatErrorMessage(response.data));
          this._balance.set(null);
          this._loading.set(false);
          return;
        }

        const data = this.normalizeWalletData(response.data, response.count);
        this._balance.set(Number(data.wallet_balance) || 0);
        this.loadSucceeded = true;
        this._loading.set(false);
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load wallet balance.');
        this._balance.set(null);
        this._loading.set(false);
      }
    });
  }

  private normalizeWalletData(data: WalletInfo | WalletInfo[] | string[], count?: number): WalletInfo {
    if (count === 0 || Array.isArray(data)) {
      return { wallet_balance: 0 };
    }

    return data;
  }

  private formatErrorMessage(data: WalletInfo | WalletInfo[] | string[]): string {
    if (Array.isArray(data) && data.every((item) => typeof item === 'string')) {
      return data.join(', ').toLowerCase();
    }

    return 'Error occurred in fetching credit information.';
  }
}
