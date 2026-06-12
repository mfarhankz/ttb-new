import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AreaSearchFormService } from '@app/features/farming/services/area-search-form.service';
import { AreaSearchService } from '@app/features/farming/services/area-search.service';

export type MapSearchContext = 'farming' | 'statistics';
export type DetailSource = 'query' | 'statistics';

export type ClearSearchContext =
  | 'detail-query'
  | 'detail-statistics'
  | 'map-farming'
  | 'map-statistics'
  | 'farming-area-search'
  | 'stats-area-search';

@Injectable({ providedIn: 'root' })
export class ClearSearchStateService {
  private readonly router = inject(Router);
  private readonly areaSearchService = inject(AreaSearchService);
  private readonly areaSearchFormService = inject(AreaSearchFormService);

  private readonly _mapShapeActive = signal(false);
  private readonly _mapSearchContext = signal<MapSearchContext | null>(null);
  private readonly _detailResultsActive = signal(false);
  private readonly _detailSource = signal<DetailSource | null>(null);
  private readonly _detailSessionId = signal<string | null>(null);
  private readonly _detailHasRows = signal(false);
  private readonly _statsAreaSearchActive = signal(false);

  readonly mapShapeActive = this._mapShapeActive.asReadonly();

  readonly areaSearchPageActive = computed(() => {
    const path = this.currentPath();
    if (!path.startsWith('/farming/area-search')) {
      return false;
    }

    return !!this.areaSearchService.countResult() || this.areaSearchFormService.hasGeometry();
  });

  readonly showClearSearch = computed(
    () =>
      this._mapShapeActive() ||
      this._detailResultsActive() ||
      this._statsAreaSearchActive() ||
      this.areaSearchPageActive()
  );

  setMapShapeActive(active: boolean, context: MapSearchContext | null = null): void {
    this._mapShapeActive.set(active);
    this._mapSearchContext.set(active ? context : null);
  }

  setDetailResultsActive(
    active: boolean,
    source: DetailSource | null = null,
    sessionId: string | null = null,
    hasRows = false
  ): void {
    this._detailResultsActive.set(active);
    this._detailSource.set(active ? source : null);
    this._detailSessionId.set(active ? sessionId : null);
    this._detailHasRows.set(active && hasRows);
  }

  setStatsAreaSearchActive(active: boolean): void {
    this._statsAreaSearchActive.set(active);
  }

  resolveActiveContext(): ClearSearchContext | null {
    if (this._detailResultsActive() && this._detailSource() === 'query') {
      return 'detail-query';
    }

    if (this._detailResultsActive() && this._detailSource() === 'statistics') {
      return 'detail-statistics';
    }

    if (this._mapShapeActive()) {
      return this._mapSearchContext() === 'statistics' ? 'map-statistics' : 'map-farming';
    }

    if (this.areaSearchPageActive()) {
      return 'farming-area-search';
    }

    if (this._statsAreaSearchActive() && this.currentPath().startsWith('/statistics/area-search')) {
      return 'stats-area-search';
    }

    return null;
  }

  needsConfirmation(): boolean {
    return this._detailHasRows() || !!this.areaSearchService.countResult();
  }

  getDetailSessionId(): string | null {
    return this._detailSessionId();
  }

  private currentPath(): string {
    return this.router.url.split('?')[0];
  }
}
