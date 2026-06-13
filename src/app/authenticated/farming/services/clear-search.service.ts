import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { AreaSearchFormService } from '@app/authenticated/farming/services/area-search-form.service';
import { AreaSearchSessionService } from './area-search-session.service';
import { AreaSearchService } from '@app/authenticated/farming/services/area-search.service';
import { AreaSearchStateService } from './area-search-state.service';
import { ClearSearchContext, ClearSearchStateService } from '@app/authenticated/farming/services/clear-search-state.service';
import { StatisticsSessionService } from '@app/authenticated/statistics/services/statistics-session.service';
import { StatsAreaSearchStateService } from '@app/authenticated/statistics/services/stats-area-search-state.service';

const CONFIRM_MESSAGE =
  'Your search criteria and results will be lost. Are you sure you want to continue?';

@Injectable({ providedIn: 'root' })
export class ClearSearchService {
  private readonly router = inject(Router);
  private readonly clearSearchState = inject(ClearSearchStateService);
  private readonly areaSearchService = inject(AreaSearchService);
  private readonly areaSearchFormService = inject(AreaSearchFormService);
  private readonly areaSearchStateService = inject(AreaSearchStateService);
  private readonly areaSearchSessionService = inject(AreaSearchSessionService);
  private readonly statisticsSessionService = inject(StatisticsSessionService);
  private readonly statsAreaSearchStateService = inject(StatsAreaSearchStateService);

  private mapClearHandler: (() => void) | null = null;

  registerMapHandler(handler: () => void): void {
    this.mapClearHandler = handler;
  }

  unregisterMapHandler(): void {
    this.mapClearHandler = null;
  }

  clearSearch(): void {
    const context = this.clearSearchState.resolveActiveContext();
    if (!context) {
      return;
    }

    if (this.clearSearchState.needsConfirmation() && !confirm(CONFIRM_MESSAGE)) {
      return;
    }

    this.executeClear(context).subscribe();
  }

  clearQueryDetail(sessionId: string | null): Observable<unknown> {
    return this.areaSearchService.clearGlobalSearch().pipe(
      tap(() => {
        if (sessionId) {
          this.areaSearchSessionService.clearSession(sessionId);
        }
        this.resetFarmingSearchState();
        this.clearSearchState.setDetailResultsActive(false);
        void this.router.navigate(['/farming/area-search']);
      })
    );
  }

  private executeClear(context: ClearSearchContext): Observable<unknown> {
    switch (context) {
      case 'detail-query':
        return this.clearQueryDetail(this.clearSearchState.getDetailSessionId());

      case 'detail-statistics':
        return of(null).pipe(tap(() => this.clearStatisticsDetail()));

      case 'map-farming':
      case 'map-statistics':
        return of(null).pipe(tap(() => this.clearMapSearch()));

      case 'farming-area-search':
        return this.clearFarmingAreaSearchPage();

      case 'stats-area-search':
        return of(null).pipe(tap(() => this.clearStatsAreaSearchPage()));
    }
  }

  private clearMapSearch(): void {
    this.mapClearHandler?.();
    this.clearSearchState.setMapShapeActive(false);
  }

  private clearStatisticsDetail(): void {
    const sessionId = this.clearSearchState.getDetailSessionId();
    const session = sessionId ? this.statisticsSessionService.getSession(sessionId) : undefined;
    const returnUrl = session?.returnUrl ?? '/statistics/radius-search';

    if (sessionId) {
      // Statistics sessions are in-memory only; no global clear API.
      this.statisticsSessionService.clearSession(sessionId);
    }

    this.statsAreaSearchStateService.reset();
    this.clearSearchState.setDetailResultsActive(false);
    void this.router.navigateByUrl(returnUrl);
  }

  private clearFarmingAreaSearchPage(): Observable<unknown> {
    const hasCount = !!this.areaSearchService.countResult();

    const finish = (): void => {
      this.areaSearchService.clearCountResult();
      this.areaSearchFormService.clearAllFields();
      this.resetFarmingSearchState();
      void this.router.navigate(['/farming/radius-search']);
    };

    if (!hasCount) {
      finish();
      return of(null);
    }

    return this.areaSearchService.clearGlobalSearch().pipe(tap(() => finish()));
  }

  private clearStatsAreaSearchPage(): void {
    const returnUrl =
      this.router.parseUrl(this.router.url).queryParams['returnUrl'] ?? '/statistics/radius-search';

    this.statsAreaSearchStateService.reset();
    this.clearSearchState.setStatsAreaSearchActive(false);
    void this.router.navigateByUrl(returnUrl);
  }

  private resetFarmingSearchState(): void {
    this.areaSearchStateService.resetHandoffState();
    this.areaSearchService.clearCountResult();
  }
}
