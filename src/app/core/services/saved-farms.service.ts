import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  SAVED_FARMS_COLUMNS,
  SAVED_FARM_TABS,
  SavedFarmTabId
} from '../config/saved-farms.config';
import { API_CONFIG } from '../config/api.config';
import { SavedFarmRecord, TtbFarmMetainfoResponse } from '../interfaces/saved-farm.interface';
import { ApiService } from './api.service';
import { VerticalService } from './vertical.service';

const SEARCH_DEBOUNCE_MS = 320;

const EMPTY_TAB_BUCKETS = (): Record<SavedFarmTabId, Record<string, unknown>[]> => ({
  main: [],
  phoneEmail: [],
  dla: [],
  riskScore: []
});

@Injectable({ providedIn: 'root' })
export class SavedFarmsService {
  private readonly apiService = inject(ApiService);
  private readonly verticalService = inject(VerticalService);

  private readonly _farmsByTab = signal<Record<SavedFarmTabId, Record<string, unknown>[]>>(EMPTY_TAB_BUCKETS());
  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _activeTab = signal<SavedFarmTabId>('main');
  private readonly _searchText = signal('');
  private readonly _searchField = signal('$');

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly activeTab = this._activeTab.asReadonly();
  readonly searchText = this._searchText.asReadonly();
  readonly searchField = this._searchField.asReadonly();
  readonly tabs = SAVED_FARM_TABS;
  readonly columns = SAVED_FARMS_COLUMNS;

  readonly tabCounts = computed(() => {
    const buckets = this._farmsByTab();
    return {
      main: buckets.main.length,
      phoneEmail: buckets.phoneEmail.length,
      dla: buckets.dla.length,
      riskScore: buckets.riskScore.length
    };
  });

  readonly totalCount = computed(() => {
    const counts = this.tabCounts();
    return counts.main + counts.phoneEmail + counts.dla + counts.riskScore;
  });

  readonly hasActiveFilters = (): boolean =>
    !!this._searchText().trim() || this._searchField() !== '$';

  private loadSucceeded = false;
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private readonly _rawFarms = signal<SavedFarmRecord[]>([]);

  constructor() {
    effect(() => {
      const records = this._rawFarms();
      // Re-bucket when vertical config loads so PH/EM prefix is available (legacy timing).
      this.verticalService.content();

      untracked(() => {
        this._farmsByTab.set(this.bucketFarms(records));
        this.refreshFilteredRows();
      });
    });
  }

  fetchFarmsList(force = false): void {
    if (!force && this.loadSucceeded) {
      this.refreshFilteredRows();
      return;
    }

    this._loading.set(true);
    this._error.set(null);

    const cacheBust = `?t=${Date.now()}`;
    this.apiService.get<TtbFarmMetainfoResponse>(`${API_CONFIG.endpoints.getFarmMetainfo}${cacheBust}`).subscribe({
      next: (response) => {
        const payload = response.response;

        if (payload.status !== 'OK') {
          this.loadSucceeded = false;
          this._error.set(payload.message ?? 'Failed to load saved farms.');
          this._rawFarms.set([]);
          this._farmsByTab.set(EMPTY_TAB_BUCKETS());
          this._rows.set([]);
          this._loading.set(false);
          return;
        }

        const records = this.normalizeFarmRecords(payload.data);
        this._rawFarms.set(records);
        this.loadSucceeded = true;
        this._loading.set(false);
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load saved farms.');
        this._farmsByTab.set(EMPTY_TAB_BUCKETS());
        this._rawFarms.set([]);
        this._rows.set([]);
        this._loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadSucceeded = false;
    this.fetchFarmsList(true);
  }

  setActiveTab(tab: SavedFarmTabId): void {
    if (this._activeTab() === tab) {
      return;
    }

    clearTimeout(this.searchDebounce);
    this._activeTab.set(tab);
    this.resetFilters(false);
    this.refreshFilteredRows();
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
    const tabRows = this._farmsByTab()[this._activeTab()] ?? [];
    this._rows.set(this.filterRowsClient(tabRows));
  }

  private bucketFarms(records: SavedFarmRecord[]): Record<SavedFarmTabId, Record<string, unknown>[]> {
    const buckets = EMPTY_TAB_BUCKETS();

    records.forEach((farm) => {
      const tab = this.getFarmTab(farm);
      buckets[tab].push(this.mapRecord(farm, buckets[tab].length));
    });

    return buckets;
  }

  private getFarmTab(farm: SavedFarmRecord): SavedFarmTabId {
    if (this.isPhoneEmailFarm(farm)) {
      return 'phoneEmail';
    }

    if (this.isRiskScoreFarm(farm)) {
      return 'riskScore';
    }

    if (this.isDlaFarm(farm)) {
      return 'dla';
    }

    return 'main';
  }

  private normalizeFarmRecords(
    data: SavedFarmRecord[] | Record<string, unknown> | undefined
  ): SavedFarmRecord[] {
    if (!data) {
      return [];
    }

    const list = Array.isArray(data) ? data : Object.values(data);

    return list.filter((item): item is SavedFarmRecord => {
      if (!item || typeof item !== 'object') {
        return false;
      }

      const farmId = (item as SavedFarmRecord).farm_id;
      return farmId != null && farmId !== '';
    });
  }

  private resolveFarmDisplayName(farm: SavedFarmRecord): string {
    for (const candidate of [farm.name, farm.alias, farm.farm_name]) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    return '';
  }

  private isPhoneEmailFarm(farm: SavedFarmRecord): boolean {
    const reserved = this.verticalService.content()?.app_config?.['reserved_farm_name_for_single_phone_email_lookups'];
    if (typeof reserved !== 'string' || !reserved) {
      return false;
    }

    const name = typeof farm.name === 'string' ? farm.name : '';
    return name.indexOf(reserved) === 0;
  }

  /** Daily Lead Alert farms — production uses live_farm_status, not generic notification_config. */
  private isDlaFarm(farm: SavedFarmRecord): boolean {
    return this.hasLiveFarmStatus(farm);
  }

  /** Risk score farms — API sets risk_score_billing_id to a billing id when subscribed. */
  private isRiskScoreFarm(farm: SavedFarmRecord): boolean {
    return this.hasRiskScoreBillingId(farm);
  }

  private hasRiskScoreBillingId(farm: SavedFarmRecord): boolean {
    const billingId = farm.risk_score_billing_id;
    if (billingId == null) {
      return false;
    }

    const normalized = String(billingId).trim().toLowerCase();
    if (!normalized || normalized === 'null' || normalized === 'undefined') {
      return false;
    }

    const asNumber = Number(billingId);
    return Number.isFinite(asNumber) && asNumber > 0;
  }

  private hasLiveFarmStatus(farm: SavedFarmRecord): boolean {
    const status = farm.live_farm_status;
    if (status == null || status === '' || status === false || status === 0 || status === '0') {
      return false;
    }

    if (status === true || status === 1 || status === '1') {
      return true;
    }

    const normalized = String(status).trim().toLowerCase();
    return normalized === 'true' || normalized === 'live' || normalized === 'active' || normalized === 'y';
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

  private mapRecord(farm: SavedFarmRecord, index: number): Record<string, unknown> {
    const name = this.resolveFarmDisplayName(farm) || '—';
    const propertyCount = farm.farm_record_count != null ? Number(farm.farm_record_count) : '—';
    const createdOn = this.formatDate(farm.created);

    return {
      id: farm.farm_id,
      farmId: farm.farm_id,
      serialNumber: index + 1,
      name,
      propertyCount,
      createdOn,
      geometry: farm.geometry,
      searchableByField: {
        name: name.toLowerCase(),
        propertyCount: String(propertyCount).toLowerCase(),
        createdOn: createdOn.toLowerCase()
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
