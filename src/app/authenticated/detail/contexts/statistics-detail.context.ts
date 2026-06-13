import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { resolveStatisticsTractRowActions } from '@app/authenticated/detail/config/detail-statistics-actions.config';
import { DETAIL_PAGE_DEFAULT_FILTER } from '@app/authenticated/detail/config/detail-page.config';
import {
  DetailContext,
  DetailContextInitState,
  DetailContextLoadResult
} from './detail-context.interface';
import { TractRecord } from '@app/core/interfaces/statistics.interface';
import { SavedFarmGeometry } from '@app/core/interfaces/saved-farm.interface';
import { StatisticsSessionService } from '@app/authenticated/statistics/services/statistics-session.service';

export const STATISTICS_SESSION_EXPIRED_ERROR =
  'Statistics session expired. Please run Statistics Area Search again.';

export function isStatisticsSessionExpiredError(error: unknown): boolean {
  return error instanceof Error && error.message === STATISTICS_SESSION_EXPIRED_ERROR;
}

@Injectable({ providedIn: 'root' })
export class StatisticsDetailContext implements DetailContext {
  readonly source = 'statistics';

  private readonly sessionService = inject(StatisticsSessionService);

  load(sessionId: string, _initState?: DetailContextInitState): Observable<DetailContextLoadResult> {
    return this.loadSession(sessionId);
  }

  refresh(
    sessionId: string,
    _activeFilter: string,
    _initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.loadSession(sessionId);
  }

  setFilter(
    sessionId: string,
    _filter: string,
    _initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.loadSession(sessionId);
  }

  excludeSelected(
    sessionId: string,
    tractIds: Array<number | string>,
    _activeFilter: string,
    _initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      return throwError(() => new Error(STATISTICS_SESSION_EXPIRED_ERROR));
    }

    const excluded = new Set(tractIds.map(String));
    if (!excluded.size) {
      return throwError(() => new Error('Select at least one tract.'));
    }

    const remaining = session.rows.filter((tract, index) => {
      const rowId = this.resolveTractRowId(tract, index);
      return !excluded.has(rowId);
    });

    this.sessionService.updateSession(sessionId, { rows: remaining });
    return this.loadSession(sessionId);
  }

  private loadSession(sessionId: string): Observable<DetailContextLoadResult> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      return throwError(() => new Error(STATISTICS_SESSION_EXPIRED_ERROR));
    }

    const geometry = this.resolveGeometry(
      session.geometry as SavedFarmGeometry | undefined,
      session.info.geometry as SavedFarmGeometry | undefined
    );

    return of({
      title: session.title,
      titleLabel: 'Statistics',
      geometry,
      rows: session.rows.map((row, index) => this.mapTractRow(row, index)),
      totalCount: session.rows.length,
      activeFilter: DETAIL_PAGE_DEFAULT_FILTER,
      showFilter: false,
      filterOptions: [],
      bulkSelectionMode: 'farm-exclude'
    });
  }

  private mapTractRow(tract: TractRecord, index: number): Record<string, unknown> {
    const serialNumber = index + 1;
    const rowId = this.resolveTractRowId(tract, index);
    const coords = this.resolveTractCoordinates(tract);

    const searchableByField: Record<string, string> = {
      tract_value: String(tract.tract_value ?? '').toLowerCase(),
      sa_site_city: String(tract.sa_site_city ?? '').toLowerCase(),
      sa_site_zip: String(tract.sa_site_zip ?? '').toLowerCase()
    };

    return {
      ...tract,
      id: rowId,
      serialNumber,
      serial_number: serialNumber,
      center_lng: coords?.lng,
      center_lat: coords?.lat,
      sa_x_coord: coords?.lng,
      sa_y_coord: coords?.lat,
      searchableByField,
      actions: resolveStatisticsTractRowActions()
    };
  }

  private resolveTractRowId(tract: TractRecord, index: number): string {
    const tractValue = tract.tract_value?.trim();
    return tractValue ? `${tractValue}-${index}` : String(index);
  }

  private resolveTractCoordinates(tract: TractRecord): { lng: number; lat: number } | undefined {
    const geo = tract.geo;
    if (!Array.isArray(geo) || geo.length < 2) {
      return undefined;
    }

    const lng = Number(geo[0]);
    const lat = Number(geo[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return undefined;
    }

    return { lng, lat };
  }

  private resolveGeometry(
    sessionGeometry?: SavedFarmGeometry,
    infoGeometry?: SavedFarmGeometry
  ): SavedFarmGeometry | undefined {
    if (sessionGeometry?.match && sessionGeometry.value) {
      return sessionGeometry;
    }

    if (infoGeometry?.match && infoGeometry.value) {
      return infoGeometry;
    }

    return undefined;
  }
}
