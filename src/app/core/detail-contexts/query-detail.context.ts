import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap, throwError } from 'rxjs';
import { AREA_SEARCH_DEFAULT_MAX_LIMIT } from '../config/area-search-fields.config';
import { DETAIL_PAGE_DEFAULT_FILTER } from '../config/detail-page.config';
import {
  DetailContext,
  DetailContextInitState,
  DetailContextLoadResult
} from './detail-context.interface';
import { AreaSearchPayload } from '../interfaces/area-search-field.interface';
import { PropertyRecordRaw } from '../interfaces/property-record.interface';
import { SavedFarmGeometry } from '../interfaces/saved-farm.interface';
import { AreaSearchService } from '../services/area-search.service';
import { AreaSearchSessionService } from '../services/area-search-session.service';
import { AreaSearchDynamicChoicesService } from '../services/area-search-dynamic-choices.service';
import { AreaSearchFieldsService } from '../services/area-search-fields.service';
import { buildSelectedCriteria } from '../utils/area-search-criteria.util';
import { payloadToFormData } from '../utils/area-search-form.util';
import { extractLeadsMeta, mapPropertyRecords } from '../utils/property-record.mapper';

export const QUERY_SESSION_EXPIRED_ERROR = 'Query session expired. Please run Area Search again.';

export function isQuerySessionExpiredError(error: unknown): boolean {
  return error instanceof Error && error.message === QUERY_SESSION_EXPIRED_ERROR;
}

@Injectable({ providedIn: 'root' })
export class QueryDetailContext implements DetailContext {
  readonly source = 'query';

  private readonly sessionService = inject(AreaSearchSessionService);
  private readonly areaSearchService = inject(AreaSearchService);
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

  excludeSelected(
    sessionId: string,
    propertyIds: Array<number | string>,
    _activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.applyPropertySelection(sessionId, 'omit_sa_property_ids', propertyIds, initState);
  }

  includeSelected(
    sessionId: string,
    propertyIds: Array<number | string>,
    _activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.applyPropertySelection(sessionId, 'include_sa_property_ids', propertyIds, initState);
  }

  private applyPropertySelection(
    sessionId: string,
    key: 'omit_sa_property_ids' | 'include_sa_property_ids',
    propertyIds: Array<number | string>,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      return throwError(() => new Error(QUERY_SESSION_EXPIRED_ERROR));
    }

    const ids = propertyIds.map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (!ids.length) {
      return throwError(() => new Error('Select at least one property.'));
    }

    const limit = Number(session.criteria.searchOptions?.max_limit) || AREA_SEARCH_DEFAULT_MAX_LIMIT;
    const page = Number(session.pagingInfo?.page) || 1;

    return this.areaSearchService
      .updateResult({ searchOptions: { [key]: ids } }, page, limit)
      .pipe(
        map((data) => {
          const rawRecords = (data.recs ?? []) as PropertyRecordRaw[];
          const leadsMeta = extractLeadsMeta(rawRecords);
          const rows = mapPropertyRecords(rawRecords, leadsMeta.leadsAttr, leadsMeta.leadsTypes);
          const criteria = data.query ?? session.criteria;

          this.sessionService.updateSession(sessionId, {
            rows,
            rawRecords,
            pagingInfo: data.paging_info,
            criteria
          });

          return this.buildSessionResult(sessionId, initState, {
            rows,
            totalCount:
              Number(data.paging_info?.total_found ?? data.paging_info?.['count'] ?? rows.length) ||
              rows.length,
            criteria,
            geometry: criteria.geometry as SavedFarmGeometry | undefined,
            leadsTypes: leadsMeta.leadsTypes.length ? leadsMeta.leadsTypes : this.extractLeadsFromRows(rows),
            criteriaChips: session.criteriaChips
          });
        })
      );
  }

  private loadSession(
    sessionId: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) {
      return throwError(() => new Error(QUERY_SESSION_EXPIRED_ERROR));
    }

    const geometry = session.criteria.geometry as SavedFarmGeometry | undefined;
    const leadsTypes = this.extractLeadsFromRows(session.rows);
    const baseResult = this.buildSessionResult(sessionId, initState, {
      rows: session.rows,
      totalCount: session.pagingInfo?.total_found ?? session.rows.length,
      criteria: session.criteria,
      geometry,
      leadsTypes,
      criteriaChips: session.criteriaChips
    });

    if (session.criteriaChips?.length) {
      return of(baseResult);
    }

    return this.fieldsService.loadFields().pipe(
      switchMap(() => {
        const fieldsInfo = this.fieldsService.getFieldsInfoSync() ?? {};
        const fieldGroups = this.fieldsService.fieldGroups();
        const formData = payloadToFormData(session.criteria, {}, fieldsInfo);
        const criteriaChips = buildSelectedCriteria(
          formData,
          fieldsInfo,
          fieldGroups,
          (fieldName, value, dependencyKey) =>
            this.dynamicChoicesService.resolveLabel(fieldName, value, dependencyKey)
        );

        this.sessionService.updateSession(sessionId, { criteriaChips });

        return of({
          ...baseResult,
          criteriaChips
        });
      })
    );
  }

  private buildSessionResult(
    sessionId: string,
    initState: DetailContextInitState | undefined,
    input: {
      rows: Record<string, unknown>[];
      totalCount: number;
      criteria: AreaSearchPayload;
      geometry?: SavedFarmGeometry;
      leadsTypes: string[];
      criteriaChips?: DetailContextLoadResult['criteriaChips'];
    }
  ): DetailContextLoadResult {
    const session = this.sessionService.getSession(sessionId);

    return {
      title: initState?.title ?? session?.title ?? 'Area Search Results',
      rows: input.rows,
      totalCount: input.totalCount,
      activeFilter: DETAIL_PAGE_DEFAULT_FILTER,
      filterOptions: [],
      showFilter: false,
      titleLabel: 'Search Results',
      bulkSelectionMode: 'query-include-exclude',
      leadsTypes: input.leadsTypes,
      geometry: input.geometry,
      criteriaChips: input.criteriaChips
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
