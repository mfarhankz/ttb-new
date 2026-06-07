import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { API_CONFIG } from '../config/api.config';
import { PurchaseHistoryRecord, TtbPurchaseHistoryResponse } from '../interfaces/api.interface';
import { DataTableColumn } from '@app/shared/components/data-table/data-table.types';

export const PURCHASE_HISTORY_COLUMNS: DataTableColumn[] = [
  { key: 'purchaseId', label: 'Purchase ID', variant: 'numeric', sortType: 'number', width: 'w-28', nowrap: true },
  { key: 'product', label: 'Product', truncate: true, sortType: 'text' },
  { key: 'orderPlaced', label: 'Order Placed', sortType: 'date', width: 'min-w-[9rem]', nowrap: true },
  { key: 'price', label: 'Price', align: 'right', variant: 'numeric', sortType: 'number', width: 'w-24', nowrap: true },
  { key: 'status', label: 'Status', align: 'center', variant: 'badge', width: 'w-28' },
  { key: 'paymentMethod', label: 'Payment Method', variant: 'muted', width: 'min-w-[9rem]', nowrap: true }
];

const SEARCH_DEBOUNCE_MS = 320;

@Injectable({ providedIn: 'root' })
export class PurchaseHistoryService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);

  private readonly _allRows = signal<Record<string, unknown>[]>([]);
  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalLoadedCount = signal(0);
  private readonly _searchText = signal('');
  private readonly _searchField = signal('$');

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalLoadedCount = this._totalLoadedCount.asReadonly();
  readonly searchText = this._searchText.asReadonly();
  readonly searchField = this._searchField.asReadonly();
  readonly columns = PURCHASE_HISTORY_COLUMNS;

  readonly hasActiveFilters = (): boolean =>
    !!this._searchText().trim() || this._searchField() !== '$';

  private loadedUserId: number | string | null = null;
  private loadSucceeded = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  fetchPurchaseHistory(force = false): void {
    const userId = this.authService.getUserId();
    if (userId == null) {
      this._error.set('Unable to determine current user.');
      return;
    }

    if (!force && this.loadSucceeded && this.loadedUserId === userId) {
      this.refreshFilteredRows();
      return;
    }

    const isNewUser = this.loadedUserId !== userId;
    this.loadedUserId = userId;
    this._loading.set(true);
    this._error.set(null);

    if (isNewUser || force) {
      this._allRows.set([]);
      this._rows.set([]);
      this._totalLoadedCount.set(0);
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
          const mapped = records.map((record) => this.mapRecord(record));
          this._allRows.set(mapped);
          this._totalLoadedCount.set(mapped.length);
          this.loadSucceeded = true;
          this._loading.set(false);
          this.refreshFilteredRows();
        },
        error: (err) => {
          this.loadSucceeded = false;
          this._error.set(err.message ?? 'Failed to load purchase history.');
          this._loading.set(false);
        }
      });
  }

  setSearchText(value: string): void {
    this._searchText.set(value);
    this.scheduleFilterRefresh();
  }

  clearSearch(): void {
    this.setSearchText('');
  }

  setSearchField(value: string): void {
    this._searchField.set(value);
    this.refreshFilteredRows();
  }

  resetFilters(reapply = true): void {
    this._searchText.set('');
    this._searchField.set('$');

    if (reapply) {
      this.refreshFilteredRows();
    }
  }

  clearCache(): void {
    this.loadedUserId = null;
    this.loadSucceeded = false;
    this._allRows.set([]);
    this._rows.set([]);
    this._totalLoadedCount.set(0);
    this._error.set(null);
    this._loading.set(false);
    this.resetFilters(false);
  }

  private scheduleFilterRefresh(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.refreshFilteredRows(), SEARCH_DEBOUNCE_MS);
  }

  private refreshFilteredRows(): void {
    this._rows.set(this.filterRowsClient(this._allRows()));
  }

  private filterRowsClient(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    return rows.filter((row) => this.matchesClientFilters(row));
  }

  private matchesClientFilters(row: Record<string, unknown>): boolean {
    const query = this._searchText().trim().toLowerCase();
    if (!query) {
      return true;
    }

    const field = this._searchField();
    const searchableByField = row['searchableByField'] as Record<string, string> | undefined;
    if (!searchableByField) {
      return false;
    }

    if (field === '$') {
      return Object.values(searchableByField).some((value) => value.includes(query));
    }

    return (searchableByField[field] ?? '').includes(query);
  }

  private mapRecord(record: PurchaseHistoryRecord): Record<string, unknown> {
    const purchaseId = record.tx_id != null ? String(record.tx_id) : '—';
    const product = record.product ?? '—';
    const orderPlaced = this.formatDate(record.purchase_date);
    const price = record.amount != null && record.amount !== '' ? `$${record.amount}` : '-';
    const status = record.status ?? '—';
    const paymentMethod = record.payment_method ?? '—';

    return {
      id: record.tx_id,
      purchaseId,
      product,
      orderPlaced,
      price,
      status,
      paymentMethod,
      searchableByField: {
        purchaseId: purchaseId.toLowerCase(),
        product: product.toLowerCase(),
        orderPlaced: orderPlaced.toLowerCase(),
        price: price.toLowerCase(),
        status: status.toLowerCase(),
        paymentMethod: paymentMethod.toLowerCase()
      }
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
