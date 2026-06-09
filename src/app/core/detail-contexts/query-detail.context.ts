import { Injectable, inject } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import { DETAIL_PAGE_DEFAULT_FILTER } from '../config/detail-page.config';
import {
  DetailContext,
  DetailContextInitState,
  DetailContextLoadResult
} from './detail-context.interface';
import { SavedFarmGeometry } from '../interfaces/saved-farm.interface';
import { AreaSearchSessionService } from '../services/area-search-session.service';
import { AreaSearchDynamicChoicesService } from '../services/area-search-dynamic-choices.service';
import { AreaSearchFieldsService } from '../services/area-search-fields.service';
import { buildSelectedCriteria } from '../utils/area-search-criteria.util';
import { payloadToFormData } from '../utils/area-search-form.util';

@Injectable({ providedIn: 'root' })
export class QueryDetailContext implements DetailContext {
  readonly source = 'query';

  private readonly sessionService = inject(AreaSearchSessionService);
  private readonly fieldsService = inject(AreaSearchFieldsService);
  private readonly dynamicChoicesService = inject(AreaSearchDynamicChoicesService);

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
      return throwError(() => new Error('Query session expired. Please run Area Search again.'));
    }

    const geometry = session.criteria.geometry as SavedFarmGeometry | undefined;
    const leadsTypes = this.extractLeadsFromRows(session.rows);
    const baseResult: DetailContextLoadResult = {
      title: initState?.title ?? session.title,
      rows: session.rows,
      totalCount: session.pagingInfo?.total_found ?? session.rows.length,
      activeFilter: DETAIL_PAGE_DEFAULT_FILTER,
      filterOptions: [],
      showFilter: false,
      titleLabel: 'Search Results',
      supportsDelete: false,
      leadsTypes,
      geometry
    };

    if (session.criteriaChips?.length) {
      return of({
        ...baseResult,
        criteriaChips: session.criteriaChips
      });
    }

    return this.fieldsService.loadFields().pipe(
      map(() => {
        const fieldsInfo = this.fieldsService.getFieldsInfoSync() ?? {};
        const fieldGroups = this.fieldsService.fieldGroups();
        const formData = payloadToFormData(session.criteria, {}, fieldsInfo);

        return {
          ...baseResult,
          criteriaChips: buildSelectedCriteria(
            formData,
            fieldsInfo,
            fieldGroups,
            (fieldName, value, dependencyKey) =>
              this.dynamicChoicesService.resolveLabel(fieldName, value, dependencyKey)
          )
        };
      })
    );
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
