import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  Observable,
  catchError,
  defer,
  map,
  of,
  subscribeOn,
  switchMap,
  throwError,
  asyncScheduler
} from 'rxjs';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  AREA_SEARCH_CONTACT_FIELD_NAME,
  AREA_SEARCH_DEFAULT_GROUP_NAMES,
  AREA_SEARCH_NO_DEFAULT_FIELDS,
  AREA_SEARCH_FIELDS_STORAGE_KEY,
  AREA_SEARCH_FIELDS_VERSION_KEY,
  AREA_SEARCH_PROCESSED_FIELDS_STORAGE_KEY,
  AREA_SEARCH_VALIDATION_FLAGGED_FIELDS
} from '@app/authenticated/farming/config/area-search-fields.config';
import {
  AreaSearchFieldGroup,
  AreaSearchFieldMeta,
  AreaSearchFieldsInfo
} from '@app/core/interfaces/area-search-field.interface';
import { TtbSearchFieldsResponse } from '@app/core/interfaces/global-search-response.interface';
import {
  normalizeChoiceFieldMeta,
  normalizeChoiceTreeFieldMeta,
  normalizeExactMatchFieldMeta,
  normalizeFieldValidation
} from '@app/core/utils/area-search-field-meta.util';
import { repairTruncatedLegacyJson } from '@app/core/utils/ttb-response.util';
import { ApiService } from '@app/core/services/api.service';
import { VerticalService } from '@app/core/services/vertical.service';

@Injectable({ providedIn: 'root' })
export class AreaSearchFieldsService {
  private readonly apiService = inject(ApiService);
  private readonly verticalService = inject(VerticalService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _fieldGroups = signal<AreaSearchFieldGroup[] | null>(null);
  private readonly _fieldsInfo = signal<AreaSearchFieldsInfo | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private memoryCache: {
    groups: AreaSearchFieldGroup[];
    fieldsInfo: AreaSearchFieldsInfo;
  } | null = null;

  readonly fieldGroups = this._fieldGroups.asReadonly();
  readonly fieldsInfo = this._fieldsInfo.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  loadFields(forceFetch = false): Observable<AreaSearchFieldGroup[]> {
    if (forceFetch) {
      this.memoryCache = null;
      this._fieldGroups.set(null);
      this._fieldsInfo.set(null);
      this.clearCachedFieldGroups();
    }

    if (!forceFetch && this._fieldGroups()) {
      return of(this._fieldGroups()!);
    }

    if (!forceFetch && this.memoryCache) {
      this._fieldGroups.set(this.memoryCache.groups);
      this._fieldsInfo.set(this.memoryCache.fieldsInfo);
      return of(this.memoryCache.groups);
    }

    this._loading.set(true);
    this._error.set(null);

    return defer(() => {
      if (!forceFetch) {
        const processedCache = this.readProcessedFieldCache();
        if (processedCache) {
          return of({ processed: processedCache, source: 'processed-cache' as const });
        }

        const cached = this.readCachedFieldGroups();
        if (cached) {
          return of({ groups: cached, source: 'raw-cache' as const });
        }
      }

      const endpoint = `${API_CONFIG.endpoints.getSearchFields}?t=${Date.now()}`;
      return this.apiService
        .getParsedJson<TtbSearchFieldsResponse | AreaSearchFieldGroup[]>(endpoint, {
          repairTruncatedJson: true
        })
        .pipe(
          map((response) => ({
            groups: this.extractFieldGroups(response),
            source: 'network' as const
          }))
        );
    }).pipe(
      subscribeOn(asyncScheduler),
      switchMap((payload) => {
        if ('processed' in payload) {
          return of(payload.processed);
        }

        const groups = payload.groups;
        if (!groups.length) {
          throw new Error('No search fields returned from the server.');
        }

        if (payload.source === 'network') {
          this.writeCachedFieldGroups(groups);
        }

        return this.processFieldGroupsAsync(groups);
      }),
      map((processed) => {
        this.writeProcessedFieldCache(processed);
        this.memoryCache = processed;
        this._fieldGroups.set(processed.groups);
        this._fieldsInfo.set(processed.fieldsInfo);
        this._loading.set(false);
        return processed.groups;
      }),
      catchError((err: Error) => {
        this._loading.set(false);
        this._error.set(err.message ?? 'Failed to load search fields.');
        this.clearCachedFieldGroups();
        return throwError(() => err);
      })
    );
  }

  getBasicFieldGroups(): AreaSearchFieldGroup[] {
    return this._fieldGroups() ?? [];
  }

  getFieldsInfoSync(): AreaSearchFieldsInfo | null {
    return this._fieldsInfo();
  }

  private extractFieldGroups(response: TtbSearchFieldsResponse | AreaSearchFieldGroup[]): AreaSearchFieldGroup[] {
    if (Array.isArray(response)) {
      return response;
    }

    const envelope = response.response;
    if (envelope?.data && Array.isArray(envelope.data)) {
      return envelope.data as AreaSearchFieldGroup[];
    }

    if (Array.isArray(response.data)) {
      return response.data as AreaSearchFieldGroup[];
    }

    const root = response as Record<string, unknown>;
    if (root['data'] && Array.isArray(root['data'])) {
      return root['data'] as AreaSearchFieldGroup[];
    }

    return [];
  }

  private processFieldGroups(fieldGroups: AreaSearchFieldGroup[]): {
    groups: AreaSearchFieldGroup[];
    fieldsInfo: AreaSearchFieldsInfo;
  } {
    const groups = this.sortFieldGroups([...fieldGroups]);
    const fieldsInfo: AreaSearchFieldsInfo = {};
    let fieldId = 0;

    const contactTabIndex = groups.findIndex((group) => group.group_id === 8);
    if (contactTabIndex > -1) {
      groups.splice(contactTabIndex, 1);
    }

    groups.push({
      layout_row: false,
      group_id: 8,
      group_name: 'Phones And Emails',
      group_order: 8,
      other_fields: null,
      fields: [
        {
          default_value: undefined,
          field_name: AREA_SEARCH_CONTACT_FIELD_NAME,
          field_order: 1,
          group_id: 8,
          include: 1,
          label: 'Include Contact',
          search_type: 'RDB',
          validation: {},
          value_type: '',
          choices: {
            $: 'Both Phones and Emails',
            PH: 'Purchase Phones',
            EM: 'Purchase Emails'
          }
        }
      ]
    });

    for (const group of groups) {
      this.resolveGroupName(group);
      if (group.group_id === 8) {
        group.layout_row = false;
      } else if (group.layout_row == null && group.fields?.length) {
        group.layout_row = group.group_id !== 6;
      }
      group.fields = Array.isArray(group.fields) ? group.fields : [];
      group.other_fields = Array.isArray(group.other_fields) ? group.other_fields : null;
      fieldId = 0;
      for (let i = 0; i < group.fields.length; i++) {
        this.processSingleField(group.fields[i], i, fieldsInfo, () => ++fieldId);
      }
      this.sortFields(group, group.fields, true);

      if (group.other_fields?.length) {
        for (let j = 0; j < group.other_fields.length; j++) {
          this.processSingleField(group.other_fields[j], j, fieldsInfo, () => ++fieldId);
        }
        this.sortFields(group, group.other_fields, false);
      }

      if (group.group_name === 'Leads') {
        this.applyLeadsValidation(group.fields);
      }
    }

    this.modifyFieldsMeta(fieldsInfo);
    return { groups, fieldsInfo };
  }

  private processSingleField(
    field: AreaSearchFieldMeta,
    _index: number,
    fieldsInfo: AreaSearchFieldsInfo,
    nextFieldId: () => number
  ): void {
    field.custom_field_id = nextFieldId();

    if (!AREA_SEARCH_VALIDATION_FLAGGED_FIELDS.includes(field.field_name as (typeof AREA_SEARCH_VALIDATION_FLAGGED_FIELDS)[number])) {
      normalizeFieldValidation(field);
    }

    if (field.search_type === 'CM' && field.grouping_choices) {
      field.search_type = 'CT';
      field.choices = field.grouping_choices as unknown as AreaSearchFieldMeta['choices'];
    }

    if (field.search_type === 'EM') {
      normalizeExactMatchFieldMeta(field);
    }

    if (field.search_type === 'C') {
      normalizeChoiceFieldMeta(field);
    }

    if (field.search_type === 'CT' || field.search_type === 'CM') {
      normalizeChoiceTreeFieldMeta(field);
    }

    this.normalizeChoicesSource(field);

    fieldsInfo[field.field_name] = field;
  }

  private applyLeadsValidation(fields: AreaSearchFieldMeta[]): void {
    for (const field of fields) {
      if (field.ngRequired) {
        continue;
      }

      switch (field.field_name) {
        case 'leads_type':
          field.ngRequired = '(has("file_date", "R") || has("insert_date", "R"))';
          break;
        case 'insert_date':
          field.ngRequired = '(has("leads_type", "CM") && !has("file_date", "R") && !has("insert_date", "R"))';
          break;
        case 'file_date':
          field.ngRequired = '(has("leads_type", "CM") && !has("file_date", "R") && !has("insert_date", "R"))';
          break;
      }
    }
  }

  private modifyFieldsMeta(fieldsInfo: AreaSearchFieldsInfo): void {
    for (const field of Object.values(fieldsInfo)) {
      if (field.field_name === 'mm_fips_state_code' && field.default_value != null) {
        const raw = String(field.default_value);
        const prefix = raw.length === 1 ? '0' : raw.length === 2 ? '' : '';
        field.default_value = `${prefix}${raw}`;
      }

      if (AREA_SEARCH_NO_DEFAULT_FIELDS.has(field.field_name)) {
        field.default_value = undefined;
      }

      if (field.field_name === 'sa_yr_blt') {
        const currentYear = new Date().getFullYear();
        field.validation = {
          ...(field.validation ?? {}),
          max: currentYear
        };
      }
    }
  }

  private sortFieldGroups(fieldGroups: AreaSearchFieldGroup[]): AreaSearchFieldGroup[] {
    const orderConfig = this.verticalService.content()?.app_config?.['area_search_form_group_order'] as
      | number[]
      | undefined;

    if (!Array.isArray(orderConfig) || !orderConfig.length) {
      return [...fieldGroups].sort((a, b) => (a.group_order ?? 0) - (b.group_order ?? 0));
    }

    const orderMap = new Map<number, number>();
    const verticalOrder = [...orderConfig];
    if (!verticalOrder.includes(8)) {
      verticalOrder.push(8);
    }

    verticalOrder.forEach((groupId, index) => orderMap.set(groupId, index));

    return [...fieldGroups].sort((a, b) => {
      const aOrder = orderMap.get(a.group_id) ?? 1000 + (a.group_order ?? a.group_id);
      const bOrder = orderMap.get(b.group_id) ?? 1000 + (b.group_order ?? b.group_id);
      return aOrder - bOrder;
    });
  }

  private normalizeChoicesSource(field: AreaSearchFieldMeta): void {
    if (!field.choices_source || typeof field.choices_source !== 'object') {
      if (['sa_site_city', 'sa_site_zip', 'mm_fips_muni_code'].includes(field.field_name)) {
        field.choices_source = field.choices_source ?? {};
      } else {
        return;
      }
    }

    const source = field.choices_source;
    if (!source['api_endpoint'] && source['endpoint']) {
      source['api_endpoint'] = source['endpoint'];
    }

    if (field.field_name === 'mm_fips_muni_code') {
      source['api_input'] = 'mm_fips_state_code';
    }

    if (field.field_name === 'sa_site_city' || field.field_name === 'sa_site_zip') {
      source['api_input'] = 'mm_fips_state_code+mm_fips_muni_code';
    }
  }

  private resolveGroupName(group: AreaSearchFieldGroup): void {
    if (group.group_name?.trim()) {
      return;
    }

    group.group_name =
      AREA_SEARCH_DEFAULT_GROUP_NAMES[group.group_id] ?? `Group ${group.group_id}`;
  }

  private sortFields(group: AreaSearchFieldGroup, fields: AreaSearchFieldMeta[], storeArrangements: boolean): void {
    fields.sort((a, b) => {
      const orderA = a.field_order ?? a.custom_field_id ?? 0;
      const orderB = b.field_order ?? b.custom_field_id ?? 0;
      return orderA - orderB;
    });

    if (storeArrangements) {
      group.fields = fields;
    } else if (group.other_fields) {
      group.other_fields = fields;
    }
  }

  private processFieldGroupsAsync(groups: AreaSearchFieldGroup[]): Observable<{
    groups: AreaSearchFieldGroup[];
    fieldsInfo: AreaSearchFieldsInfo;
  }> {
    return new Observable((subscriber) => {
      const run = (): void => {
        try {
          subscriber.next(this.processFieldGroups(groups));
          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      };

      if (isPlatformBrowser(this.platformId) && typeof requestIdleCallback === 'function') {
        requestIdleCallback(run, { timeout: 100 });
        return;
      }

      setTimeout(run, 0);
    });
  }

  private readProcessedFieldCache(): {
    groups: AreaSearchFieldGroup[];
    fieldsInfo: AreaSearchFieldsInfo;
  } | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const version = this.verticalService.content()?.app_config?.['data_version'] as
      | { get_search_fields?: string | number }
      | undefined;
    const expectedVersion = version?.get_search_fields;
    const cachedVersion = localStorage.getItem(AREA_SEARCH_FIELDS_VERSION_KEY);

    if (expectedVersion != null && cachedVersion !== String(expectedVersion)) {
      return null;
    }

    const raw = localStorage.getItem(AREA_SEARCH_PROCESSED_FIELDS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as {
        groups?: AreaSearchFieldGroup[];
        fieldsInfo?: AreaSearchFieldsInfo;
      };

      if (!Array.isArray(parsed.groups) || !parsed.fieldsInfo) {
        return null;
      }

      return {
        groups: parsed.groups,
        fieldsInfo: parsed.fieldsInfo
      };
    } catch {
      return null;
    }
  }

  private writeProcessedFieldCache(processed: {
    groups: AreaSearchFieldGroup[];
    fieldsInfo: AreaSearchFieldsInfo;
  }): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(
      AREA_SEARCH_PROCESSED_FIELDS_STORAGE_KEY,
      JSON.stringify({
        groups: processed.groups,
        fieldsInfo: processed.fieldsInfo
      })
    );

    const version = this.verticalService.content()?.app_config?.['data_version'] as
      | { get_search_fields?: string | number }
      | undefined;
    if (version?.get_search_fields != null) {
      localStorage.setItem(AREA_SEARCH_FIELDS_VERSION_KEY, String(version.get_search_fields));
    }
  }

  private readCachedFieldGroups(): AreaSearchFieldGroup[] | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const version = this.verticalService.content()?.app_config?.['data_version'] as
      | { get_search_fields?: string | number }
      | undefined;
    const expectedVersion = version?.get_search_fields;
    const cachedVersion = localStorage.getItem(AREA_SEARCH_FIELDS_VERSION_KEY);

    if (expectedVersion != null && cachedVersion !== String(expectedVersion)) {
      return null;
    }

    const raw = localStorage.getItem(AREA_SEARCH_FIELDS_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(repairTruncatedLegacyJson(raw)) as AreaSearchFieldGroup[];
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private clearCachedFieldGroups(): void {
    this.memoryCache = null;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(AREA_SEARCH_FIELDS_STORAGE_KEY);
    localStorage.removeItem(AREA_SEARCH_PROCESSED_FIELDS_STORAGE_KEY);
    localStorage.removeItem(AREA_SEARCH_FIELDS_VERSION_KEY);
  }

  private writeCachedFieldGroups(groups: AreaSearchFieldGroup[]): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(AREA_SEARCH_FIELDS_STORAGE_KEY, JSON.stringify(groups));

    const version = this.verticalService.content()?.app_config?.['data_version'] as
      | { get_search_fields?: string | number }
      | undefined;
    if (version?.get_search_fields != null) {
      localStorage.setItem(AREA_SEARCH_FIELDS_VERSION_KEY, String(version.get_search_fields));
    }
  }
}
