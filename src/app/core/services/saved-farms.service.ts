import { Injectable, inject, signal } from '@angular/core';
import { SAVED_FARMS_COLUMNS } from '../config/saved-farms.config';
import { API_CONFIG } from '../config/api.config';
import { SavedFarmRecord, TtbFarmMetainfoResponse } from '../interfaces/saved-farm.interface';
import { ApiService } from './api.service';
import { VerticalService } from './vertical.service';

@Injectable({ providedIn: 'root' })
export class SavedFarmsService {
  private readonly apiService = inject(ApiService);
  private readonly verticalService = inject(VerticalService);

  private readonly _rows = signal<Record<string, unknown>[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _totalCount = signal(0);

  readonly rows = this._rows.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly totalCount = this._totalCount.asReadonly();
  readonly columns = SAVED_FARMS_COLUMNS;

  private loadSucceeded = false;

  fetchFarmsList(force = false): void {
    if (!force && this.loadSucceeded) {
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
          this._rows.set([]);
          this._totalCount.set(0);
          this._loading.set(false);
          return;
        }

        const records = Array.isArray(payload.data) ? payload.data : [];
        const standardFarms = records.filter((farm) => !this.isPhoneEmailFarm(farm));
        const mapped = standardFarms.map((farm, index) => this.mapRecord(farm, index));

        this._rows.set(mapped);
        this._totalCount.set(payload.count ?? mapped.length);
        this.loadSucceeded = true;
        this._loading.set(false);
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load saved farms.');
        this._rows.set([]);
        this._totalCount.set(0);
        this._loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadSucceeded = false;
    this.fetchFarmsList(true);
  }

  private isPhoneEmailFarm(farm: SavedFarmRecord): boolean {
    const reserved = this.verticalService.content()?.app_config?.['reserved_farm_name_for_single_phone_email_lookups'];
    if (typeof reserved !== 'string' || !reserved) {
      return false;
    }

    return (farm.name ?? '').indexOf(reserved) === 0;
  }

  private mapRecord(farm: SavedFarmRecord, index: number): Record<string, unknown> {
    return {
      id: farm.farm_id,
      farmId: farm.farm_id,
      serialNumber: index + 1,
      name: farm.name ?? '—',
      propertyCount: farm.farm_record_count != null ? Number(farm.farm_record_count) : '—',
      createdOn: this.formatDate(farm.created),
      geometry: farm.geometry
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
