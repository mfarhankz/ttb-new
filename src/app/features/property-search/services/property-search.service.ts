import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  AddressSearchFormData,
  AddressSearchPayload,
  CountyFipsOption,
  OwnerSearchPayload,
  ParcelSearchPayload,
  PropertyAddressType,
  PropertySearchResult
} from '@app/core/interfaces/property-search.interface';
import { PropertyRecordRaw } from '@app/core/interfaces/property-record.interface';
import { extractLeadsMeta, mapPropertyRecords } from '@app/core/utils/property-record.mapper';
import { ApiService } from '@app/core/services/api.service';

interface TtbSearchResponse {
  response?: {
    status?: string;
    message?: string;
    data?: PropertyRecordRaw[] | Record<string, PropertyRecordRaw>;
  };
}

interface TtbAutocompleteFipsResponse {
  response?: {
    status?: string;
    data?: Record<string, string>;
  };
}

interface TtbExtraInfoResponse {
  response?: {
    status?: string;
    data?: Record<string, Record<string, unknown>>;
  };
}

@Injectable({ providedIn: 'root' })
export class PropertySearchService {
  private readonly apiService = inject(ApiService);

  searchAddress(
    form: AddressSearchFormData,
    addressType: PropertyAddressType,
    siteStateForMailing: string,
    countiesWithFips: { key: string; value: string }[] = [],
    stateFips?: string | null
  ): Observable<PropertySearchResult> {
    const validationError = this.validateAddressForm(form);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    const payload = this.buildAddressPayload(
      form,
      addressType,
      siteStateForMailing,
      countiesWithFips,
      stateFips
    );
    return this.runSearch(API_CONFIG.endpoints.searchProperty, payload as Record<string, unknown>, 'address');
  }

  searchOwner(payload: OwnerSearchPayload): Observable<PropertySearchResult> {
    return this.runSearch(
      API_CONFIG.endpoints.searchOwner,
      this.compactPayload(payload as Record<string, unknown>),
      'owner'
    );
  }

  searchParcel(payload: ParcelSearchPayload): Observable<PropertySearchResult> {
    return this.runSearch(
      API_CONFIG.endpoints.searchParcel,
      this.compactPayload(payload as Record<string, unknown>),
      'parcel'
    );
  }

  autocompleteCounties(countyName: string): Observable<CountyFipsOption[]> {
    if (countyName.trim().length < 3) {
      return of([]);
    }

    return this.apiService
      .postParsedJson<TtbAutocompleteFipsResponse>(API_CONFIG.endpoints.autocompleteFips, {
        county_name: countyName
      })
      .pipe(
        map((response) => {
          const data = response.response?.data;
          if (!data || response.response?.status !== 'OK') {
            return [];
          }

          return Object.entries(data).map(([fips, name]) => ({
            fips,
            name: String(name)
          }));
        })
      );
  }

  validateAddressForm(form: AddressSearchFormData): string | null {
    if (!form.site_state?.trim()) {
      return 'State & City or Zip code required.';
    }

    if (!form.site_city?.trim() && !form.site_zip?.trim()) {
      return 'State & City or Zip code required.';
    }

    return null;
  }

  currentSearchTimestamp(): string {
    return this.formatSearchTime();
  }

  buildFullSiteAddress(form: AddressSearchFormData): string {
    const parts = [
      form.site_street_number,
      form.site_route,
      form.site_city,
      form.site_state,
      form.site_zip
    ]
      .map((part) => (part != null ? String(part).trim() : ''))
      .filter(Boolean);

    return parts.join(', ');
  }

  private buildAddressPayload(
    form: AddressSearchFormData,
    addressType: PropertyAddressType,
    siteStateForMailing: string,
    countiesWithFips: { key: string; value: string }[],
    stateFips?: string | null
  ): AddressSearchPayload {
    const payload: AddressSearchPayload = {
      ...this.compactPayload(form as Record<string, unknown>),
      address_type: addressType,
      siteStateForMailing,
      site_full_address: this.buildFullSiteAddress(form),
      searchTime: this.formatSearchTime()
    };

    if (payload.site_street_number || payload.site_route) {
      payload.site_address = `${payload.site_street_number ?? ''}${
        payload.site_street_number && payload.site_route ? ' ' : ''
      }${payload.site_route ?? ''}`.trim();
    }

    if (!payload.state_county_fips && stateFips && payload.county && countiesWithFips.length) {
      const countyKey = payload.county.replace(/ County$/i, '').toUpperCase();
      const selectedCounty = countiesWithFips.find(
        (county) => county.value.toUpperCase() === countyKey || county.value === payload.county
      );
      if (selectedCounty) {
        payload.state_county_fips = `${stateFips}${selectedCounty.key}`;
      }
    }

    if (payload.county) {
      payload.county = this.formatCountyLabel(payload.county);
    }

    if (addressType === 'mailing_address') {
      return this.toMailingPayload(payload, siteStateForMailing);
    }

    return payload;
  }

  private toMailingPayload(
    payload: AddressSearchPayload,
    siteStateForMailing: string
  ): AddressSearchPayload {
    const mailing: AddressSearchPayload = {};

    for (const [fieldName, value] of Object.entries(payload)) {
      if (value == null || value === '') {
        continue;
      }

      const mailField = fieldName.startsWith('site_')
        ? fieldName.replace('site_', 'mail_')
        : fieldName;

      (mailing as Record<string, unknown>)[mailField] = value;
    }

    mailing.site_state = siteStateForMailing;
    delete mailing.siteStateForMailing;

    return mailing;
  }

  private formatCountyLabel(county: string): string {
    const normalized = county.replace(/ County$/i, '').trim();
    if (!normalized) {
      return county;
    }

    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1).toLowerCase()} County`;
  }

  private formatSearchTime(): string {
    const now = new Date();
    return `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  }

  private runSearch(
    endpoint: string,
    payload: Record<string, unknown>,
    _searchType: string
  ): Observable<PropertySearchResult> {
    return this.apiService.postParsedJson<TtbSearchResponse>(endpoint, payload).pipe(
      switchMap((response) => {
        const envelope = response.response;
        if (!envelope || envelope.status !== 'OK') {
          const message =
            typeof envelope?.data === 'object' && Array.isArray(envelope?.data)
              ? envelope.data.join(', ')
              : 'Could not find the property.';
          return throwError(() => new Error(message));
        }

        const rawRecords = this.normalizeRecords(envelope.data);
        if (!rawRecords.length) {
          return throwError(() => new Error('No property match this criteria.'));
        }

        return this.enrichWithExtraInfo(rawRecords).pipe(
          map((enriched) => {
            const { leadsTypes, leadsAttr } = extractLeadsMeta(enriched);
            const rows = mapPropertyRecords(enriched, leadsAttr, leadsTypes);

            return {
              records: rows,
              rawRecords: enriched,
              message: `${enriched.length} matching properties found.`,
              count: enriched.length
            };
          })
        );
      })
    );
  }

  private enrichWithExtraInfo(records: PropertyRecordRaw[]): Observable<PropertyRecordRaw[]> {
    const first = records[0];
    if (!first?.['mm_fips_state_code']) {
      return of(records);
    }

    const request = {
      mm_fips_state_code: first['mm_fips_state_code'],
      property_ids: records
        .map((record) => record.sa_property_id)
        .filter((id) => id != null)
    };

    return this.apiService
      .postParsedJson<TtbExtraInfoResponse>(API_CONFIG.endpoints.getExtraInfoBrief, request)
      .pipe(
        map((response) => {
          const extraInfo = response.response?.data ?? {};
          return records.map((record) => ({
            ...record,
            customExtraInfo: extraInfo[String(record.sa_property_id ?? '')] ?? {}
          }));
        }),
        catchError(() => of(records))
      );
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

  private compactPayload<T extends Record<string, unknown>>(data: T): T {
    const payload = {} as T;

    for (const [key, value] of Object.entries(data)) {
      if (value != null && value !== '') {
        (payload as Record<string, unknown>)[key] = value;
      }
    }

    return payload;
  }
}
