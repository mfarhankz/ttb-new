import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  DETAIL_PAGE_DEFAULT_FILTER,
  FARM_DETAIL_FILTER_OPTIONS
} from '@app/features/detail/config/detail-page.config';
import {
  DetailContext,
  DetailContextInitState,
  DetailContextLoadResult
} from './detail-context.interface';
import {
  FarmMetainfoByIdResponse,
  GetFarmPropertiesResponse,
  PropertyRecordRaw
} from '@app/core/interfaces/property-record.interface';
import { SavedFarmGeometry, SavedFarmRecord } from '@app/core/interfaces/saved-farm.interface';
import { ApiService } from '@app/core/services/api.service';
import { extractLeadsMeta, mapPropertyRecords } from '@app/core/utils/property-record.mapper';

const FARM_PROPERTIES_PAGE_LIMIT = 1000;

@Injectable({ providedIn: 'root' })
export class FarmDetailContext implements DetailContext {
  readonly source = 'farm';

  private readonly apiService = inject(ApiService);

  load(sourceId: string, initState?: DetailContextInitState): Observable<DetailContextLoadResult> {
    return this.loadFarm(sourceId, DETAIL_PAGE_DEFAULT_FILTER, initState);
  }

  refresh(
    sourceId: string,
    activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.loadFarm(sourceId, activeFilter, initState, true);
  }

  setFilter(
    sourceId: string,
    filter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    return this.loadFarm(sourceId, filter, initState, true);
  }

  excludeSelected(
    sourceId: string,
    propertyIds: Array<number | string>,
    activeFilter: string,
    initState?: DetailContextInitState
  ): Observable<DetailContextLoadResult> {
    const payload = {
      farm_id: Number(sourceId),
      omit_sa_property_ids: propertyIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    };

    return this.apiService
      .postParsedJson<GetFarmPropertiesResponse>(
        `${API_CONFIG.endpoints.updateFarm}?limit=1000&page=1`,
        payload
      )
      .pipe(
        map((response) => {
          const result = this.parsePropertiesResponse(response);
          return this.buildLoadResult(
            initState?.title ?? 'Farm',
            initState?.geometry,
            activeFilter,
            result
          );
        })
      );
  }

  private loadFarm(
    farmId: string,
    filter: string,
    initState?: DetailContextInitState,
    skipMetaIfCached = false
  ): Observable<DetailContextLoadResult> {
    const hasCachedMeta = !!(initState?.title || initState?.geometry);

    const meta$ =
      skipMetaIfCached && hasCachedMeta
        ? undefined
        : this.fetchFarmMeta(farmId).pipe(
            map((meta) => ({
              title: this.resolveFarmTitle(meta, initState?.title),
              geometry: (meta?.geometry ?? initState?.geometry) as SavedFarmGeometry | SavedFarmGeometry[] | undefined
            }))
          );

    const properties$ = this.fetchFarmProperties(farmId, filter);

    if (meta$) {
      return meta$.pipe(
        switchMap((meta) =>
          properties$.pipe(
            map((result) => this.buildLoadResult(meta.title, meta.geometry, filter, result))
          )
        )
      );
    }

    return properties$.pipe(
      map((result) =>
        this.buildLoadResult(
          initState?.title ?? 'Farm',
          initState?.geometry,
          filter,
          result
        )
      )
    );
  }

  private buildLoadResult(
    title: string,
    geometry: SavedFarmGeometry | SavedFarmGeometry[] | undefined,
    filter: string,
    result: { rows: Record<string, unknown>[]; totalCount: number; leadsTypes: string[] }
  ): DetailContextLoadResult {
    return {
      title,
      geometry,
      rows: result.rows,
      totalCount: result.totalCount,
      activeFilter: filter,
      filterOptions: FARM_DETAIL_FILTER_OPTIONS,
      showFilter: true,
      titleLabel: 'Selected Farm',
      bulkSelectionMode: 'farm-exclude',
      leadsTypes: result.leadsTypes
    };
  }

  private fetchFarmMeta(farmId: string): Observable<SavedFarmRecord | null> {
    const cacheBust = `?t=${Date.now()}`;
    return this.apiService
      .get<FarmMetainfoByIdResponse>(
        `${API_CONFIG.endpoints.getFarmMetainfoById}/${farmId}.json${cacheBust}`
      )
      .pipe(
        map((response) => {
          const payload = response.response;
          if (payload.status !== 'OK' || !payload.data) {
            return null;
          }

          return payload.data as SavedFarmRecord;
        })
      );
  }

  private fetchFarmProperties(
    farmId: string,
    filter: string
  ): Observable<{ rows: Record<string, unknown>[]; totalCount: number; leadsTypes: string[] }> {
    const endpoint = `${API_CONFIG.endpoints.getFarm}/${farmId}.json?page=1&limit=${FARM_PROPERTIES_PAGE_LIMIT}`;
    const body = { customFilters: this.buildCustomFilters(filter) };

    return this.apiService.postParsedJson<GetFarmPropertiesResponse>(endpoint, body).pipe(
      map((response) => this.parsePropertiesResponse(response))
    );
  }

  private parsePropertiesResponse(response: GetFarmPropertiesResponse): {
    rows: Record<string, unknown>[];
    totalCount: number;
    leadsTypes: string[];
  } {
    const payload = response.response;

    if (payload.status !== 'OK') {
      throw new Error(payload.message ?? 'No records found in selected farm for the selected filter.');
    }

    const records = this.normalizeRecords(payload.data);
    if (!records.length) {
      throw new Error('No records found in selected farm for the selected filter.');
    }

    const { leadsTypes, leadsAttr } = extractLeadsMeta(records);
    const rows = mapPropertyRecords(records, leadsAttr, leadsTypes);
    const totalCount = Number(payload.paging?.count ?? payload.count ?? rows.length);

    return { rows, totalCount, leadsTypes };
  }

  private buildCustomFilters(filter: string): Record<string, string> {
    if (filter === 'sa_site_mail_same') {
      return { is_nonowner_search: 'N' };
    }

    if (!filter || filter === 'is_all_search') {
      return {};
    }

    return { [filter]: 'Y' };
  }

  private normalizeRecords(
    data: PropertyRecordRaw[] | Record<string, PropertyRecordRaw> | undefined
  ): PropertyRecordRaw[] {
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data;
    }

    return Object.values(data);
  }

  private resolveFarmTitle(meta: SavedFarmRecord | null, fallback?: string): string {
    if (fallback?.trim()) {
      return fallback.trim();
    }

    if (!meta) {
      return 'Farm';
    }

    const name = meta.name ?? meta.farm_name ?? meta.alias;
    return name != null && String(name).trim() ? String(name).trim() : 'Farm';
  }
}

const SUPPORTED_DETAIL_SOURCES = new Set(['farm', 'search', 'query', 'statistics']);

export function isUnsupportedDetailSource(source: string): boolean {
  return !SUPPORTED_DETAIL_SOURCES.has(source);
}
