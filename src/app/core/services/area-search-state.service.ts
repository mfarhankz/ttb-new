import { Injectable, signal } from '@angular/core';
import { AreaSearchPayload } from '../interfaces/area-search-field.interface';
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

  readonly pendingGeometry = this._pendingGeometry.asReadonly();
  readonly editCriteria = this._editCriteria.asReadonly();
  readonly showQueriesPanel = this._showQueriesPanel.asReadonly();
  readonly activeQueriesTab = this._activeQueriesTab.asReadonly();
  readonly queryId = this._queryId.asReadonly();
  readonly queryName = this._queryName.asReadonly();

  setPendingGeometry(geometry: AreaSearchPendingGeometry | null): void {
    this._pendingGeometry.set(geometry);
  }

  consumePendingGeometry(): AreaSearchPendingGeometry | null {
    const geometry = this._pendingGeometry();
    this._pendingGeometry.set(null);
    return geometry;
  }

  setEditCriteria(criteria: AreaSearchPayload | null): void {
    this._editCriteria.set(criteria);
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
}
