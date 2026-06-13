import { Injectable, signal } from '@angular/core';
import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
export interface AreaSearchPendingGeometry {
  match: string;
  value: unknown;
}

@Injectable({ providedIn: 'root' })
export class AreaSearchStateService {
  private readonly _pendingGeometry = signal<AreaSearchPendingGeometry | null>(null);
  private readonly _editCriteria = signal<AreaSearchPayload | null>(null);
  private readonly _showQueriesPanel = signal(false);
  private readonly _activeQueriesTab = signal<0 | 1>(1);
  private readonly _queryId = signal<string | null>(null);
  private readonly _queryName = signal<string | null>(null);
  private readonly _runGetCountOnEntry = signal(false);
  private readonly _premierDataFromSearch123 = signal(false);

  readonly pendingGeometry = this._pendingGeometry.asReadonly();
  readonly editCriteria = this._editCriteria.asReadonly();
  readonly showQueriesPanel = this._showQueriesPanel.asReadonly();
  readonly activeQueriesTab = this._activeQueriesTab.asReadonly();
  readonly queryId = this._queryId.asReadonly();
  readonly queryName = this._queryName.asReadonly();

  setPendingGeometry(geometry: AreaSearchPendingGeometry | null, runGetCount = false): void {
    this._pendingGeometry.set(geometry);
    this._runGetCountOnEntry.set(runGetCount);
  }

  consumePendingGeometry(): AreaSearchPendingGeometry | null {
    const geometry = this._pendingGeometry();
    this._pendingGeometry.set(null);
    return geometry;
  }

  consumeRunGetCountOnEntry(): boolean {
    const run = this._runGetCountOnEntry();
    this._runGetCountOnEntry.set(false);
    return run;
  }

  setEditCriteria(criteria: AreaSearchPayload | null): void {
    this._editCriteria.set(criteria);
  }

  setPremierDataFromSearch123(enabled: boolean): void {
    this._premierDataFromSearch123.set(enabled);
  }

  consumePremierDataFromSearch123(): boolean {
    const enabled = this._premierDataFromSearch123();
    this._premierDataFromSearch123.set(false);
    return enabled;
  }

  consumeEditCriteria(): AreaSearchPayload | null {
    const criteria = this._editCriteria();
    this._editCriteria.set(null);
    return criteria;
  }

  toggleQueriesPanel(): void {
    this._showQueriesPanel.update((open) => !open);
  }

  setActiveQueriesTab(tab: 0 | 1): void {
    this._activeQueriesTab.set(tab);
  }

  setQueryMeta(queryId: string | null, queryName: string | null): void {
    this._queryId.set(queryId);
    this._queryName.set(queryName);
  }

  resetHandoffState(): void {
    this._pendingGeometry.set(null);
    this._editCriteria.set(null);
    this._runGetCountOnEntry.set(false);
    this._queryId.set(null);
    this._queryName.set(null);
    this._premierDataFromSearch123.set(false);
  }
}
