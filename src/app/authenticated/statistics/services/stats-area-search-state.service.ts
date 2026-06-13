import { Injectable, signal } from '@angular/core';
import { TractStatsFormData } from '@app/core/interfaces/statistics.interface';
import { MapDrawnGeometry } from '@app/authenticated/map/services/ol-map.service';

@Injectable({ providedIn: 'root' })
export class StatsAreaSearchStateService {
  private readonly _pendingGeometry = signal<MapDrawnGeometry | null>(null);
  private readonly _runDirectSubmitOnEntry = signal(false);
  private readonly _returnUrl = signal<string | null>(null);
  private readonly _editPayload = signal<TractStatsFormData | null>(null);
  private readonly _editGroupType = signal<'sa_site_city' | 'sa_site_zip' | null>(null);

  setPendingGeometry(
    geometry: MapDrawnGeometry | null,
    directSubmit = false,
    returnUrl?: string
  ): void {
    this._pendingGeometry.set(geometry);
    this._runDirectSubmitOnEntry.set(directSubmit);
    if (returnUrl) {
      this._returnUrl.set(returnUrl);
    }
  }

  setEditCriteria(
    payload: TractStatsFormData,
    groupType: 'sa_site_city' | 'sa_site_zip',
    options?: { geometry?: MapDrawnGeometry; returnUrl?: string }
  ): void {
    this._editPayload.set(payload);
    this._editGroupType.set(groupType);
    if (options?.geometry) {
      this._pendingGeometry.set(options.geometry);
    }
    if (options?.returnUrl) {
      this._returnUrl.set(options.returnUrl);
    }
  }

  consumePendingGeometry(): MapDrawnGeometry | null {
    const geometry = this._pendingGeometry();
    this._pendingGeometry.set(null);
    return geometry;
  }

  consumeRunDirectSubmitOnEntry(): boolean {
    const run = this._runDirectSubmitOnEntry();
    this._runDirectSubmitOnEntry.set(false);
    return run;
  }

  consumeReturnUrl(): string | null {
    const returnUrl = this._returnUrl();
    this._returnUrl.set(null);
    return returnUrl;
  }

  consumeEditPayload(): TractStatsFormData | null {
    const payload = this._editPayload();
    this._editPayload.set(null);
    return payload;
  }

  consumeEditGroupType(): 'sa_site_city' | 'sa_site_zip' | null {
    const groupType = this._editGroupType();
    this._editGroupType.set(null);
    return groupType;
  }

  reset(): void {
    this._pendingGeometry.set(null);
    this._runDirectSubmitOnEntry.set(false);
    this._returnUrl.set(null);
    this._editPayload.set(null);
    this._editGroupType.set(null);
  }
}
