import { Injectable, inject } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import { DETAIL_PAGE_DEFAULT_FILTER } from '../config/detail-page.config';
import {
  DetailContext,
  DetailContextInitState,
  DetailContextLoadResult
} from './detail-context.interface';
import { PropertySearchSessionService } from '../services/property-search-session.service';
@Injectable({ providedIn: 'root' })
export class SearchDetailContext implements DetailContext {
  readonly source = 'search';

  private readonly sessionService = inject(PropertySearchSessionService);

  load(sessionId: string, initState?: DetailContextInitState): Observable<DetailContextLoadResult> {
    return this.loadSession(sessionId, initState);
  }

  refresh(
    sessionId: string,
    _activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.loadSession(sessionId, initState);
  }

  setFilter(
    sessionId: string,
    _filter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.loadSession(sessionId, initState);
  }

  private loadSession(
    sessionId: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      return throwError(() => new Error('Search session expired. Please run Property Search again.'));
    }

    return of(this.buildLoadResult(initState?.title ?? session.title, session.rows));
  }

  private buildLoadResult(title: string, rows: Record<string, unknown>[]): DetailContextLoadResult {
    const leadsTypes = this.extractLeadsFromRows(rows);

    return {
      title,
      rows,
      totalCount: rows.length,
      activeFilter: DETAIL_PAGE_DEFAULT_FILTER,
      filterOptions: [],
      showFilter: false,
      titleLabel: 'Search Results',
      leadsTypes
    };
  }

  private extractLeadsFromRows(rows: Record<string, unknown>[]): string[] {
    const prefixes = new Set<string>();

    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (/^[A-Z]{2,4}$/.test(key)) {
          prefixes.add(key);
        }
      }
    }

    return [...prefixes];
  }
}
