import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { API_CONFIG } from '../config/api.config';
import { PurchaseHistoryRecord, TtbPurchaseHistoryResponse } from '../interfaces/api.interface';
import { DataTableColumn } from '../../shared/components/data-table/data-table.types';

export const PURCHASE_HISTORY_COLUMNS: DataTableColumn[] = [
  { key: 'purchaseId', label: 'Purchase ID', variant: 'numeric', sortType: 'number', width: 'w-28', nowrap: true },
  { key: 'product', label: 'Product', truncate: true, sortType: 'text' },
  { key: 'orderPlaced', label: 'Order Placed', sortType: 'date', width: 'min-w-[9rem]', nowrap: true },
  { key: 'price', label: 'Price', align: 'right', variant: 'numeric', sortType: 'number', width: 'w-24', nowrap: true },
  { key: 'status', label: 'Status', align: 'center', variant: 'badge', width: 'w-28' },
  { key: 'paymentMethod', label: 'Payment Method', variant: 'muted', width: 'min-w-[9rem]', nowrap: true }
];

@Injectable({ providedIn: 'root' })
export class PurchaseHistoryService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly columns = PURCHASE_HISTORY_COLUMNS;

  private loadedUserId: number | string | null = null;
  private loadSucceeded = false;

  fetchPurchaseHistory(force = false): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this._error.set('Unable to determine current user.');
      return;
    }

    if (!force && this.loadSucceeded && this.loadedUserId === userId) {
      return;
    }

    const isNewUser = this.loadedUserId !== userId;
    this.loadedUserId = userId;
    this._loading.set(true);
    this._error.set(null);

    if (isNewUser || force) {
      this._rows.set([]);
    }

    this.apiService
      .post<TtbPurchaseHistoryResponse>(API_CONFIG.endpoints.showPurchaseHistory, { user_id: userId })
      .subscribe({
        next: (response) => {
          const payload = response.response;

          if (payload.status !== 'OK') {
            this.loadSucceeded = false;
            this._error.set(payload.message ?? 'Failed to load purchase history.');
            this._loading.set(false);
            return;
          }

          const rawData = payload.data;
          const records = Array.isArray(rawData) ? rawData : [];
          this._rows.set(records.map(record => this.mapRecord(record)));
          this.loadSucceeded = true;
          this._loading.set(false);
        },
        error: (err) => {
          this.loadSucceeded = false;
          this._error.set(err.message ?? 'Failed to load purchase history.');
          this._loading.set(false);
        }
      });
  }

  clearCache(): void {
    this.loadedUserId = null;
    this.loadSucceeded = false;
    this._rows.set([]);
    this._error.set(null);
    this._loading.set(false);
  }

  private mapRecord(record: PurchaseHistoryRecord): Record<string, unknown> {
    return {
      id: record.tx_id,
      purchaseId: record.tx_id ?? '—',
      product: record.product ?? '—',
      orderPlaced: this.formatDate(record.purchase_date),
      price: record.amount != null && record.amount !== '' ? `$${record.amount}` : '-',
      status: record.status ?? '—',
      paymentMethod: record.payment_method ?? '—'
    };
  }

  private formatDate(value?: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
  }
}
