import { Injectable, inject, signal } from '@angular/core';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  tap,
  timeout
} from 'rxjs';
import { AREA_SEARCH_DEPENDENT_CHOICE_PREFETCH } from '../config/area-search-fields.config';
import { AreaSearchFieldsInfo } from '../interfaces/area-search-field.interface';
import { API_CONFIG } from '../config/api.config';
import { US_STATE_AREA_SEARCH_OPTIONS } from '../config/us-states.config';
import {
  AreaSearchFieldMeta,
  AreaSearchFormData,
  AreaSearchFormFieldValue
} from '../interfaces/area-search-field.interface';
import { AreaSearchChoiceOption } from '../interfaces/area-search-field.interface';
import { extractChoicesRecord } from '../utils/area-choices-response.util';
import { ApiService } from './api.service';

interface DynamicChoicesRequest {
  field: AreaSearchFieldMeta;
  formData: AreaSearchFormData;
  autocompleteQuery?: string;
}

const LAZY_LOAD_CHOICE_FIELDS = [
  'mm_fips_muni_code',
  'sa_site_city',
  'sa_site_zip',
  'leads_type'
] as const;

const FIELD_ENDPOINT_FALLBACKS: Record<string, string> = {
  mm_fips_state_code: API_CONFIG.endpoints.getStates,
  mm_fips_muni_code: API_CONFIG.endpoints.getCounties,
  sa_site_city: 'get_cities',
  sa_site_zip: 'get_zipcodes',
  sa_mail_state: 'get_mail_states',
  sa_subdivision: 'get_subdivision_and_tractname',
  leads_type: 'get_lead_types'
};

const FIELD_API_INPUT_FALLBACKS: Record<string, string> = {
  mm_fips_muni_code: 'mm_fips_state_code',
  sa_site_city: 'mm_fips_state_code+mm_fips_muni_code',
  sa_site_zip: 'mm_fips_state_code+mm_fips_muni_code',
  leads_type: 'mm_fips_state_code+mm_fips_muni_code'
};

const MAX_CHOICE_OPTIONS = 500;
const REQUEST_TIMEOUT_MS = 20_000;

@Injectable({ providedIn: 'root' })
export class AreaSearchDynamicChoicesService {
  private readonly apiService = inject(ApiService);
  private readonly inflight = new Map<string, Observable<AreaSearchChoiceOption[]>>();
  private readonly resultsCache = new Map<string, AreaSearchChoiceOption[]>();
  private readonly choiceLabelIndex = new Map<string, string>();
  private readonly _loadingFieldKeys = signal<ReadonlySet<string>>(new Set());

  shouldLazyLoadField(fieldName: string): boolean {
    return (LAZY_LOAD_CHOICE_FIELDS as readonly string[]).includes(fieldName);
  }

  clearInflight(): void {
    this.inflight.clear();
    this.resultsCache.clear();
    this._loadingFieldKeys.set(new Set());
  }

  clearLabelCache(): void {
    this.choiceLabelIndex.clear();
  }

  isLoading(fieldName: string, dependencyKey = 'static'): boolean {
    return this._loadingFieldKeys().has(this.buildLoadingKey(fieldName, dependencyKey));
  }

  prefetchDependents(formData: AreaSearchFormData, fieldsInfo: AreaSearchFieldsInfo): void {
    if (!this.isGeographicFieldDisabled('mm_fips_muni_code', formData)) {
      this.warmFieldChoices('mm_fips_muni_code', formData, fieldsInfo);
    }

    if (!this.isGeographicFieldDisabled('sa_site_city', formData)) {
      this.warmFieldChoices('sa_site_city', formData, fieldsInfo);
    }

    if (!this.isGeographicFieldDisabled('sa_site_zip', formData)) {
      this.warmFieldChoices('sa_site_zip', formData, fieldsInfo);
    }
  }

  prefetchForParentChange(
    parentFieldName: string,
    formData: AreaSearchFormData,
    fieldsInfo: AreaSearchFieldsInfo
  ): void {
    const dependents = AREA_SEARCH_DEPENDENT_CHOICE_PREFETCH[parentFieldName] ?? [];
    for (const fieldName of dependents) {
      if (this.isGeographicFieldDisabled(fieldName, formData)) {
        continue;
      }

      this.warmFieldChoices(fieldName, formData, fieldsInfo);
    }
  }

  invalidateDependents(parentFieldName: string): void {
    const fieldNames =
      parentFieldName === 'mm_fips_state_code'
        ? ['mm_fips_muni_code', 'sa_site_city', 'sa_site_zip']
        : parentFieldName === 'mm_fips_muni_code'
          ? ['sa_site_city', 'sa_site_zip']
          : [];

    if (!fieldNames.length) {
      return;
    }

    for (const cacheKey of [...this.resultsCache.keys(), ...this.inflight.keys()]) {
      if (fieldNames.some((fieldName) => cacheKey.startsWith(`${fieldName}:`))) {
        this.resultsCache.delete(cacheKey);
        this.inflight.delete(cacheKey);
      }
    }

    this._loadingFieldKeys.update((current) => {
      const next = new Set(current);
      for (const loadingKey of current) {
        if (fieldNames.some((fieldName) => loadingKey.startsWith(`${fieldName}:`))) {
          next.delete(loadingKey);
        }
      }
      return next;
    });
  }

  isFieldChoicesDisabled(
    field: AreaSearchFieldMeta,
    formData: AreaSearchFormData,
    hasGeometry = false
  ): boolean {
    if (['mm_fips_muni_code', 'sa_site_city', 'sa_site_zip'].includes(field.field_name)) {
      return this.isGeographicFieldDisabled(field.field_name, formData, hasGeometry);
    }

    if (
      field.choices_source ||
      field.field_name === 'mm_fips_state_code' ||
      field.field_name === 'leads_type'
    ) {
      return !this.hasRequiredInputs(field, formData);
    }

    return false;
  }

  isGeographicFieldDisabled(
    fieldName: string,
    formData: AreaSearchFormData,
    hasGeometry = false
  ): boolean {
    const hasState = this.hasScalarChoiceValue(formData['mm_fips_state_code']);
    const hasCounty = this.hasCountyValue(formData);

    switch (fieldName) {
      case 'mm_fips_muni_code':
        return hasGeometry || !hasState;
      case 'sa_site_city':
      case 'sa_site_zip':
        return !hasState || !hasCounty;
      default:
        return false;
    }
  }

  private warmFieldChoices(
    fieldName: string,
    formData: AreaSearchFormData,
    fieldsInfo: AreaSearchFieldsInfo
  ): void {
    const field = fieldsInfo[fieldName];
    if (
      !field ||
      this.isGeographicFieldDisabled(fieldName, formData) ||
      !this.hasRequiredInputs(field, formData)
    ) {
      return;
    }

    this.fetchChoices({ field, formData }).subscribe();
  }

  private hasScalarChoiceValue(fieldValue?: AreaSearchFormFieldValue): boolean {
    const value = fieldValue?.value;
    return value != null && value !== '';
  }

  private hasCountyValue(formData: AreaSearchFormData): boolean {
    return this.hasChoiceValue(formData['mm_fips_muni_code']);
  }

  private hasChoiceValue(fieldValue?: AreaSearchFormFieldValue): boolean {
    return this.hasRawChoiceValue(fieldValue?.value);
  }

  private hasRawChoiceValue(value: unknown): boolean {
    if (value == null || value === '' || value === '_blank_') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.some((entry) => entry != null && entry !== '' && entry !== '_blank_');
    }

    return true;
  }

  private normalizeInputSegment(value: unknown): string {
    if (!this.hasRawChoiceValue(value)) {
      return '';
    }

    if (Array.isArray(value)) {
      return value
        .filter((entry) => entry != null && entry !== '' && entry !== '_blank_')
        .map(String)
        .join('');
    }

    return String(value);
  }

  resolveLabel(fieldName: string, value: string, dependencyKey = 'static'): string | undefined {
    return this.choiceLabelIndex.get(`${fieldName}:${dependencyKey}:${value}`);
  }

  fetchChoices(request: DynamicChoicesRequest): Observable<AreaSearchChoiceOption[]> {
    const { field, formData, autocompleteQuery } = request;

    if (field.field_name === 'mm_fips_state_code') {
      return of(this.cacheAndReturn(field, formData, US_STATE_AREA_SEARCH_OPTIONS));
    }

    if (!this.resolveChoicesEndpoint(field)) {
      return of([]);
    }

    if (
      this.isGeographicFieldDisabled(field.field_name, formData) &&
      ['mm_fips_muni_code', 'sa_site_city', 'sa_site_zip'].includes(field.field_name)
    ) {
      return of([]);
    }

    if (!this.hasRequiredInputs(field, formData) && !autocompleteQuery) {
      return of([]);
    }

    const cacheKey = this.buildCacheKey(field, formData, autocompleteQuery);
    const cached = this.resultsCache.get(cacheKey);
    if (cached) {
      return of(this.cacheAndReturn(field, formData, cached));
    }

    const existing = this.inflight.get(cacheKey);
    if (existing) {
      return existing;
    }

    const loadingKey = this.buildLoadingKey(field.field_name, this.buildDependencyKey(field, formData));

    const request$ = this.executeFetch(field, formData, autocompleteQuery).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      map((options) => this.cacheAndReturn(field, formData, options)),
      tap((options) => this.resultsCache.set(cacheKey, options)),
      catchError(() => of([])),
      shareReplay(1),
      finalize(() => {
        this.inflight.delete(cacheKey);
        this.setLoading(loadingKey, false);
      })
    );

    this.setLoading(loadingKey, true);
    this.inflight.set(cacheKey, request$);
    return request$;
  }

  private buildLoadingKey(fieldName: string, dependencyKey: string): string {
    return `${fieldName}:${dependencyKey}`;
  }

  private setLoading(loadingKey: string, loading: boolean): void {
    this._loadingFieldKeys.update((current) => {
      const next = new Set(current);
      if (loading) {
        next.add(loadingKey);
      } else {
        next.delete(loadingKey);
      }
      return next;
    });
  }

  hasRequiredInputs(field: AreaSearchFieldMeta, formData: AreaSearchFormData): boolean {
    const apiInput = this.getApiInput(field);
    if (!apiInput) {
      return true;
    }

    return apiInput
      .split('+')
      .every((inputName) => this.hasChoiceValue(formData[inputName.trim()]));
  }

  isAutocompleteField(field: AreaSearchFieldMeta): boolean {
    return field.choices_source?.['behavior'] === 'autocomplete';
  }

  private executeFetch(
    field: AreaSearchFieldMeta,
    formData: AreaSearchFormData,
    autocompleteQuery?: string
  ): Observable<AreaSearchChoiceOption[]> {
    const endpoint = this.buildEndpoint(field, formData, autocompleteQuery);
    if (!endpoint) {
      return of([]);
    }

    const usePost =
      !!field.choices_source?.['api_post_method'] || field.field_name === 'leads_type' || !!autocompleteQuery;

    if (usePost) {
      const payload = this.buildPayload(field, formData, autocompleteQuery);
      return this.apiService.postParsedJson<unknown>(endpoint, payload).pipe(
        map((response) => this.parseChoicesResponse(field, response, formData))
      );
    }

    return this.apiService.getParsedJson<unknown>(endpoint).pipe(
      map((response) => this.parseChoicesResponse(field, response, formData))
    );
  }

  private resolveChoicesEndpoint(field: AreaSearchFieldMeta): string | null {
    const fallback = this.normalizeEndpointPath(FIELD_ENDPOINT_FALLBACKS[field.field_name]);
    const source = field.choices_source ?? {};
    const raw = source['api_endpoint'] ?? source['endpoint'];

    if (!raw) {
      return fallback;
    }

    const normalized = this.normalizeEndpointPath(String(raw));
    if (!normalized) {
      return fallback;
    }

    // Legacy metadata can mistakenly store FIPS fragments (e.g. "06") as the endpoint.
    if (/^\d{2,5}$/.test(normalized)) {
      return fallback;
    }

    if (!normalized.includes('get_') && fallback) {
      return fallback;
    }

    return normalized;
  }

  private normalizeEndpointPath(raw: string | undefined): string | null {
    if (!raw) {
      return null;
    }

    const normalized = String(raw)
      .trim()
      .replace(/^webservices\//i, '')
      .replace(/^\//, '')
      .replace(/\.json$/i, '');

    return normalized || null;
  }

  private buildEndpoint(
    field: AreaSearchFieldMeta,
    formData: AreaSearchFormData,
    autocompleteQuery?: string
  ): string {
    const base = this.resolveChoicesEndpoint(field);
    if (!base) {
      return '';
    }

    const usePost =
      !!field.choices_source?.['api_post_method'] || field.field_name === 'leads_type' || !!autocompleteQuery;
    if (usePost) {
      return `/${base}.json`;
    }

    const input = this.buildInputString(field, formData);
    return input ? `/${base}/${input}.json` : `/${base}.json`;
  }

  private buildPayload(
    field: AreaSearchFieldMeta,
    formData: AreaSearchFormData,
    autocompleteQuery?: string
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    const apiInput = this.getApiInput(field);

    if (apiInput) {
      for (const inputName of apiInput.split('+')) {
        const key = inputName.trim();
        const value = formData[key]?.value;
        if (this.hasRawChoiceValue(value)) {
          payload[key] = value;
        }
      }
    }

    const optionalInput = field.choices_source?.['api_input_optional'];
    if (typeof optionalInput === 'string') {
      for (const inputName of optionalInput.split('+')) {
        const key = inputName.trim();
        const value = formData[key]?.value;
        if (value != null && value !== '') {
          payload[key] = value;
        }
      }
    }

    if (autocompleteQuery) {
      payload['name_partial'] = autocompleteQuery;
    }

    return payload;
  }

  buildInputString(field: AreaSearchFieldMeta, formData: AreaSearchFormData): string {
    const apiInput = this.getApiInput(field);
    if (!apiInput) {
      return '';
    }

    let input = '';
    for (const inputName of apiInput.split('+')) {
      const segment = this.normalizeInputSegment(formData[inputName.trim()]?.value);
      if (!segment) {
        return '';
      }

      input += segment;
    }

    return input;
  }

  getApiInput(field: AreaSearchFieldMeta): string | undefined {
    const enforced = FIELD_API_INPUT_FALLBACKS[field.field_name];
    if (enforced) {
      return enforced;
    }

    const apiInput = field.choices_source?.['api_input'];
    if (typeof apiInput === 'string') {
      return apiInput;
    }

    return undefined;
  }

  buildDependencyKey(field: AreaSearchFieldMeta, formData: AreaSearchFormData): string {
    const apiInput = this.getApiInput(field);
    if (!apiInput) {
      return 'static';
    }

    return apiInput
      .split('+')
      .map((inputName) => this.normalizeInputSegment(formData[inputName.trim()]?.value))
      .join('|');
  }

  private buildCacheKey(
    field: AreaSearchFieldMeta,
    formData: AreaSearchFormData,
    autocompleteQuery?: string
  ): string {
    return [
      field.field_name,
      this.buildInputString(field, formData),
      autocompleteQuery ?? ''
    ].join(':');
  }

  private parseChoicesResponse(
    field: AreaSearchFieldMeta,
    response: unknown,
    formData?: AreaSearchFormData
  ): AreaSearchChoiceOption[] {
    if (field.field_name === 'leads_type' && Array.isArray(response)) {
      const options = response
        .map((entry) => {
          const record = entry as Record<string, unknown>;
          return {
            value: String(record['type'] ?? record['key'] ?? ''),
            label: String(record['name'] ?? record['value'] ?? record['type'] ?? '')
          };
        })
        .filter((option) => option.value)
        .sort((a, b) => a.label.localeCompare(b.label))
        .slice(0, MAX_CHOICE_OPTIONS);

      return formData ? this.cacheAndReturn(field, formData, options) : options;
    }

    const envelope = extractChoicesRecord(response, { includeDataRoot: true });
    if (!envelope) {
      return [];
    }

    const options = this.mapChoiceEntries(field.field_name, envelope)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, MAX_CHOICE_OPTIONS);

    return formData ? this.cacheAndReturn(field, formData, options) : options;
  }

  private mapChoiceEntries(fieldName: string, record: Record<string, string>): AreaSearchChoiceOption[] {
    const entries = Object.entries(record);
    if (!entries.length) {
      return [];
    }

    const [sampleKey, sampleValue] = entries[0];
    const keyLooksLikeCode = /^\d{2,5}$/.test(sampleKey);
    const valueLooksLikeCode = /^\d{2,5}$/.test(String(sampleValue));

    return entries
      .map(([left, right]) => {
        const code = keyLooksLikeCode || !valueLooksLikeCode ? left : right;
        const name = keyLooksLikeCode || !valueLooksLikeCode ? right : left;
        return {
          value: String(code),
          label: this.formatChoiceLabel(fieldName, String(name))
        };
      })
      .filter((option) => option.value);
  }

  private formatChoiceLabel(fieldName: string, label: string): string {
    if (['mm_fips_muni_code', 'sa_site_city', 'sa_site_zip'].includes(fieldName)) {
      return label.toUpperCase();
    }

    return label;
  }

  private cacheAndReturn(
    field: AreaSearchFieldMeta,
    formData: AreaSearchFormData,
    options: AreaSearchChoiceOption[]
  ): AreaSearchChoiceOption[] {
    const dependencyKey = this.buildDependencyKey(field, formData);
    for (const option of options) {
      this.choiceLabelIndex.set(`${field.field_name}:${dependencyKey}:${option.value}`, option.label);
    }
    return options;
  }
}
