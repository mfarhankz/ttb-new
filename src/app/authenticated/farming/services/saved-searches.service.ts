import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { resolveSavedSearchRowActions } from '@app/authenticated/farming/config/saved-searches-actions.config';
import { SAVED_SEARCHES_COLUMNS } from '@app/authenticated/farming/config/saved-searches.config';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  RemoveQueryPayload,
  RenameQueryPayload,
  SavedSearchRecord,
  TtbRemoveQueryResponse,
  TtbRenameQueryResponse,
  TtbSavedQueriesResponse
} from '@app/core/interfaces/saved-search.interface';
import { ApiService } from '@app/core/services/api.service';
import { VerticalService } from '@app/core/services/vertical.service';

const SEARCH_DEBOUNCE_MS = 320;

@Injectable({ providedIn: 'root' })
export class SavedSearchesService {
  private readonly apiService = inject(ApiService);
  private readonly verticalService = inject(VerticalService);

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
  readonly columns = SAVED_SEARCHES_COLUMNS;

  readonly totalCount = computed(() => this._allRows().length);

  readonly hasActiveFilters = (): boolean =>
    !!this._searchText().trim() || this._searchField() !== '$';

  private loadSucceeded = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private readonly _rawRecords = signal<SavedSearchRecord[]>([]);

  /** Re-apply row actions when vertical config loads (e.g. automation_support). */
  reapplyRowActions(): void {
    const records = this._rawRecords();
    if (!records.length) {
      return;
    }

    const mapped = records.map((record, index) => this.mapRecord(record, index));
    this._allRows.set(mapped);
    this.refreshFilteredRows();
  }

  fetchList(force = false): void {
    if (!force && this.loadSucceeded) {
      this.refreshFilteredRows();
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const cacheBust = `?t=${Date.now()}`;
    this.apiService.get<TtbSavedQueriesResponse>(`${API_CONFIG.endpoints.getSavedQueries}${cacheBust}`).subscribe({
      next: (response) => {
        const payload = response.response;

        if (payload.status !== 'OK') {
          this.loadSucceeded = false;
          this._error.set(payload.message ?? 'Failed to load saved searches.');
          this._rawRecords.set([]);
          this._allRows.set([]);
          this._rows.set([]);
          this._loading.set(false);
          return;
        }

        const records = this.normalizeRecords(payload.data);
        this._rawRecords.set(records);
        const mapped = records.map((record, index) => this.mapRecord(record, index));
        this._allRows.set(mapped);
        this.loadSucceeded = true;
        this.refreshFilteredRows();
        this._loading.set(false);
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load saved searches.');
        this._rawRecords.set([]);
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

  removeQueries(queryIds: Array<number | string>): Observable<string> {
    const payload: RemoveQueryPayload = {
      query_ids: queryIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    };

    return this.apiService.post<TtbRemoveQueryResponse>(API_CONFIG.endpoints.removeQuery, payload).pipe(
      map((response) => {
        const envelope = response.response;

        if (envelope.status !== 'OK') {
          const message = this.coalesceMessage(envelope.data?.msg);
          throw new Error(message || 'Failed to delete saved search(es).');
        }

        return this.coalesceMessage(envelope.data?.msg) || 'Successfully deleted the saved search(es).';
      })
    );
  }

  renameQuery(queryId: number | string, newName: string): Observable<void> {
    const payload: RenameQueryPayload = {
      query_id: Number(queryId),
      new_name: newName.trim()
    };

    return this.apiService.post<TtbRenameQueryResponse>(API_CONFIG.endpoints.renameQuery, payload).pipe(
      map((response) => {
        const envelope = response.response;

        if (envelope.status !== 'OK') {
          throw new Error(envelope.message ?? 'Failed to rename saved search.');
        }
      })
    );
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
    data: SavedSearchRecord[] | Record<string, unknown> | undefined
  ): SavedSearchRecord[] {
    if (!data) {
      return [];
    }

    const list = Array.isArray(data) ? data : Object.values(data);

    return list
      .filter((item): item is SavedSearchRecord => {
        if (!item || typeof item !== 'object') {
          return false;
        }

        const queryId = (item as SavedSearchRecord).query_id;
        return queryId != null && queryId !== '';
      })
      .sort((a, b) => this.parseDateValue(b.created) - this.parseDateValue(a.created));
  }

  private mapRecord(record: SavedSearchRecord, index: number): Record<string, unknown> {
    const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : '—';
    const createdBy =
      typeof record.created_by_user === 'string' && record.created_by_user.trim()
        ? record.created_by_user.trim()
        : '—';
    const sharedTo =
      typeof record.shared_to_user === 'string' && record.shared_to_user.trim()
        ? record.shared_to_user.trim()
        : '—';
    const createdOn = this.formatDate(record.created);

    return {
      id: record.query_id,
      queryId: record.query_id,
      serialNumber: index + 1,
      name,
      createdBy,
      sharedTo,
      createdOn,
      createdOnSort: this.parseDateValue(record.created),
      liveQueryStatus: record.live_query_status,
      query: record.query,
      actions: resolveSavedSearchRowActions(this.isDynamicDataEnabled()),
      searchableByField: {
        name: name.toLowerCase(),
        createdBy: createdBy.toLowerCase(),
        sharedTo: sharedTo.toLowerCase(),
        createdOn: createdOn.toLowerCase()
      }
    };
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

  private isDynamicDataEnabled(): boolean {
    const automationSupport = this.verticalService.content()?.app_config?.['automation_support'];
    if (automationSupport === false || automationSupport === 0 || automationSupport === '0') {
      return false;
    }

    return !!automationSupport;
  }

  private coalesceMessage(msg?: string | string[]): string {
    if (Array.isArray(msg)) {
      return msg.filter(Boolean).join(', ');
    }

    if (typeof msg === 'string' && msg.trim()) {
      return msg.trim();
    }

    return '';
  }

  private parseDateValue(value?: string): number {
    if (!value) {
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
