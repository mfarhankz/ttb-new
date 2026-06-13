import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { resolveSavedNetSheetRowActions } from '@app/authenticated/farming/config/saved-net-sheets-actions.config';
import { SAVED_NET_SHEETS_COLUMNS } from '@app/authenticated/farming/config/saved-net-sheets.config';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  DeleteNetsheetPayload,
  SavedNetsheetRecord,
  TtbDeleteNetsheetResponse,
  TtbNetsheetListResponse
} from '@app/core/interfaces/saved-netsheet.interface';
import { ApiService } from '@app/core/services/api.service';

const SEARCH_DEBOUNCE_MS = 320;

@Injectable({ providedIn: 'root' })
export class SavedNetSheetsService {
  private readonly apiService = inject(ApiService);

  private readonly _allRows = signal<Record<string, unknown>[]>([]);
  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _searchText = signal('');
  private readonly _searchField = signal('$');

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly searchText = this._searchText.asReadonly();
  readonly searchField = this._searchField.asReadonly();
  readonly columns = SAVED_NET_SHEETS_COLUMNS;

  readonly totalCount = computed(() => this._allRows().length);

  readonly hasActiveFilters = (): boolean =>
    !!this._searchText().trim() || this._searchField() !== '$';

  private loadSucceeded = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;

  fetchList(force = false): void {
    if (!force && this.loadSucceeded) {
      this.refreshFilteredRows();
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    this.apiService.post<TtbNetsheetListResponse>(API_CONFIG.endpoints.getNetsheetList, {}).subscribe({
      next: (response) => {
        const payload = response.response;

        if (payload.status !== 'OK') {
          this.loadSucceeded = false;
          this._error.set(payload.message ?? 'Failed to load saved net sheets.');
          this._allRows.set([]);
          this._rows.set([]);
          this._loading.set(false);
          return;
        }

        const records = this.normalizeRecords(payload.data);
        const mapped = records.map((record, index) => this.mapRecord(record, index));
        this._allRows.set(mapped);
        this.loadSucceeded = true;
        this.refreshFilteredRows();
        this._loading.set(false);
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load saved net sheets.');
        this._allRows.set([]);
        this._rows.set([]);
        this._loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadSucceeded = false;
    this.fetchList(true);
  }

  deleteNetsheets(netsheetIds: Array<number | string>): Observable<string> {
    const ids = netsheetIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!ids.length) {
      return of('');
    }

    const requests = ids.map((netsheetId) => {
      const payload: DeleteNetsheetPayload = { netsheet_id: netsheetId };
      return this.apiService.post<TtbDeleteNetsheetResponse>(API_CONFIG.endpoints.deleteNetsheet, payload).pipe(
        map((response) => {
          const envelope = response.response;

          if (envelope.status !== 'OK') {
            const message = this.coalesceDeleteMessage(envelope.data);
            throw new Error(message || 'Failed to delete net sheet.');
          }

          return this.coalesceDeleteMessage(envelope.data) || 'Net sheet deleted.';
        })
      );
    });

    return forkJoin(requests).pipe(map((messages) => messages[messages.length - 1] ?? 'Net sheet(s) deleted.'));
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

  private scheduleFilterRefresh(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.refreshFilteredRows(), SEARCH_DEBOUNCE_MS);
  }

  private refreshFilteredRows(): void {
    this._rows.set(this.filterRowsClient(this._allRows()));
  }

  private normalizeRecords(
    data: SavedNetsheetRecord[] | Record<string, unknown> | undefined
  ): SavedNetsheetRecord[] {
    if (!data) {
      return [];
    }

    const list = Array.isArray(data) ? data : Object.values(data);

    return list
      .filter((item): item is SavedNetsheetRecord => {
        if (!item || typeof item !== 'object') {
          return false;
        }

        const netsheetId = (item as SavedNetsheetRecord).netsheet_id;
        return netsheetId != null && netsheetId !== '';
      })
      .sort((a, b) => this.parseDateValue(b.time_last_saved) - this.parseDateValue(a.time_last_saved));
  }

  private mapRecord(record: SavedNetsheetRecord, index: number): Record<string, unknown> {
    const propertyAddress =
      typeof record.property_address === 'string' && record.property_address.trim()
        ? record.property_address.trim()
        : '—';
    const netsheetType = this.resolveNetsheetType(record);
    const lastSaved = this.formatDate(record.time_last_saved);
    const lastSavedRaw = record.time_last_saved ?? '';

    return {
      id: record.netsheet_id,
      netsheetId: record.netsheet_id,
      propertyId: record.property_id,
      serialNumber: index + 1,
      propertyAddress,
      netsheetType,
      lastSaved,
      lastSavedSort: this.parseDateValue(record.time_last_saved),
      actions: resolveSavedNetSheetRowActions(),
      searchableByField: {
        propertyAddress: propertyAddress.toLowerCase(),
        netsheetType: netsheetType.toLowerCase(),
        lastSaved: `${lastSaved} ${lastSavedRaw}`.toLowerCase()
      }
    };
  }

  private resolveNetsheetType(record: SavedNetsheetRecord): string {
    const type = record.netsheet_type ?? record.netsheet_last_saved;
    if (typeof type === 'string' && type.trim()) {
      return type.trim();
    }

    return '—';
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

  private coalesceDeleteMessage(data?: string[] | { msg?: string }): string {
    if (Array.isArray(data)) {
      return data.filter(Boolean).join(', ');
    }

    if (data && typeof data === 'object' && typeof data.msg === 'string' && data.msg.trim()) {
      return data.msg.trim();
    }

    return '';
  }

  private parseDateValue(value?: string): number {
    if (!value || value === '0000-00-00') {
      return 0;
    }

    const splitted = value.trim().split(' ');
    const date = new Date(splitted[0].replace(/-/g, '/'));
    if (splitted[1]) {
      const parts = splitted[1].split(':');
      date.setHours(Number(parts[0]) || 0);
      date.setMinutes(Number(parts[1]) || 0);
      date.setSeconds(Number(parts[2]) || 0);
    }

    const time = date.getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private formatDate(value?: string): string {
    if (!value || value === '0000-00-00') {
      return '—';
    }

    const splitted = value.trim().split(' ');
    const date = new Date(splitted[0].replace(/-/g, '/'));
    if (splitted[1]) {
      const parts = splitted[1].split(':');
      date.setHours(Number(parts[0]) || 0);
      date.setMinutes(Number(parts[1]) || 0);
      date.setSeconds(Number(parts[2]) || 0);
    }

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}
