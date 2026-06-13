import { Injectable, inject } from '@angular/core';
import { PREMIUM_FIELD_GROUP_IDS } from '@app/authenticated/farming/config/area-search-fields.config';
import {
  SEARCH_123_ALLOWED_MAX_LIMIT,
  SEARCH_123_DEFAULT_MAX_LIMIT
} from '@app/authenticated/search-123/config/search-123.config';
import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
import { CommonAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { VerticalService } from '@app/core/services/vertical.service';
import { GeographicAreaFieldsValue } from '@app/shared/widgets/geographic-area-fields/geographic-area-fields.types';
import { MapDrawnGeometry } from '@app/authenticated/map/services/ol-map.service';

export interface Search123FormState {
  countyStateCheck: boolean;
  maxLimitCheck: boolean;
  maxLimitValue: number;
  omitSavedRecords: boolean;
  geographic: GeographicAreaFieldsValue;
}

export interface Search123BuildInput {
  form: Search123FormState;
  selectedQuery: CommonAreaSearchQuery | null;
  geometry?: MapDrawnGeometry;
  selectedShape?: 'circle' | 'polygon' | null;
}

@Injectable({ providedIn: 'root' })
export class Search123Service {
  private readonly verticalService = inject(VerticalService);

  readonly allowedMaxLimit = SEARCH_123_ALLOWED_MAX_LIMIT;

  verticalMaxRecsSearchLimit(): number | undefined {
    const limit = this.verticalService.content()?.app_config?.['limit_per_search'];
    return limit != null ? Number(limit) : undefined;
  }

  defaultMaxLimitValue(): number {
    const verticalLimit = this.verticalMaxRecsSearchLimit();
    return verticalLimit ?? SEARCH_123_DEFAULT_MAX_LIMIT;
  }

  isPremierDataLinkEnabled(): boolean {
    const config = this.verticalService.content()?.app_config;
    if (!config) {
      return false;
    }

    return !this.hasSubscription() && !this.isPayPerRecord();
  }

  buildPayload(input: Search123BuildInput): AreaSearchPayload {
    const payload: AreaSearchPayload = {
      customFilters: {},
      searchOptions: {
        omit_saved_records: input.form.omitSavedRecords
      }
    };

    const selectedQuery = input.selectedQuery?.query;
    if (selectedQuery) {
      const queryCopy = structuredClone(selectedQuery) as AreaSearchPayload;
      delete queryCopy.searchOptions;
      if (queryCopy.customFilters) {
        payload.customFilters = { ...queryCopy.customFilters };
      }
      Object.assign(payload, queryCopy);
    }

    this.applyGeographicToPayload(payload, input.form);

    if (input.selectedShape && input.geometry) {
      payload.geometry = {
        match: input.geometry.match,
        value: input.geometry.value
      };
    }

    if (input.form.maxLimitCheck && input.form.maxLimitValue) {
      payload.searchOptions = payload.searchOptions ?? {};
      payload.searchOptions.max_limit = input.form.maxLimitValue;
    }

    return payload;
  }

  isCriteriaPremier(criteria: AreaSearchPayload): boolean {
    const config = this.verticalService.content()?.app_config;
    if (config?.['pay_per_rec'] || config?.['pay_per_search']) {
      return true;
    }

    const contactInfo = criteria.searchOptions?.include_contact_info;
    if (Array.isArray(contactInfo) && contactInfo.length) {
      return true;
    }

    if (this.hasSubscription()) {
      return false;
    }

    return this.hasPremierFieldValues(criteria);
  }

  requiresPayment(recPrice: unknown): boolean {
    return recPrice != null && Number(recPrice) > 0;
  }

  validateMaxLimit(maxLimitCheck: boolean, maxLimitValue: number): string | null {
    if (!maxLimitCheck || !maxLimitValue) {
      return null;
    }

    const verticalLimit = this.verticalMaxRecsSearchLimit();
    if (verticalLimit && maxLimitValue > verticalLimit) {
      return `The recs limit allowed per search is <strong>${verticalLimit}</strong>, Limit revised to maximum allowed.`;
    }

    if (maxLimitValue > SEARCH_123_ALLOWED_MAX_LIMIT) {
      return `Limit Record = ${maxLimitValue}. This value can't be greater than ${SEARCH_123_ALLOWED_MAX_LIMIT}.`;
    }

    return null;
  }

  revisedMaxLimit(maxLimitValue: number): number {
    const verticalLimit = this.verticalMaxRecsSearchLimit();
    if (verticalLimit && maxLimitValue > verticalLimit) {
      return verticalLimit;
    }

    return maxLimitValue;
  }

  private applyGeographicToPayload(payload: AreaSearchPayload, form: Search123FormState): void {
    if (form.countyStateCheck) {
      Object.assign(payload, this.geographicToPayload(form.geographic));
      return;
    }

    if (form.geographic.stateFips) {
      payload['mm_fips_state_code'] = form.geographic.stateFips;
    }

    if (form.geographic.countyFips) {
      payload['mm_fips_muni_code'] = form.geographic.countyFips;
    }
  }

  private geographicToPayload(geo: GeographicAreaFieldsValue): Partial<AreaSearchPayload> {
    const payload: Partial<AreaSearchPayload> = {};

    if (geo.stateFips) {
      payload['mm_fips_state_code'] = geo.stateFips;
    }
    if (geo.countyFips) {
      payload['mm_fips_muni_code'] = geo.countyFips;
    }
    if (geo.siteCities?.length) {
      payload['sa_site_city'] = [...geo.siteCities];
    } else if (geo.siteCity) {
      payload['sa_site_city'] = [geo.siteCity];
    }
    if (geo.siteZips?.length) {
      payload['sa_site_zip'] = [...geo.siteZips];
    } else if (geo.siteZip) {
      payload['sa_site_zip'] = [geo.siteZip];
    }

    return payload;
  }

  private hasSubscription(): boolean {
    const config = this.verticalService.content()?.app_config;
    return !!(config?.['enable_billing'] || config?.['free_premier_data']);
  }

  private isPayPerRecord(): boolean {
    return !!this.verticalService.content()?.app_config?.['pay_per_rec'];
  }

  private hasPremierFieldValues(criteria: AreaSearchPayload): boolean {
    const premierHints = new Set([
      'leads_type',
      'include_contact_info',
      'sa_date_transfer',
      'sa_mortgage_date',
      'mm_mtg_type',
      'mm_mtg_amt',
      'mm_mtg_lender_name'
    ]);

    for (const key of Object.keys(criteria)) {
      if (key === 'searchOptions' || key === 'customFilters' || key === 'geometry') {
        continue;
      }
      if (premierHints.has(key) && criteria[key] != null && criteria[key] !== '') {
        return true;
      }
    }

    const searchOptions = criteria.searchOptions ?? {};
    for (const key of Object.keys(searchOptions)) {
      if (key !== 'omit_saved_records' && key !== 'max_limit' && searchOptions[key] != null) {
        if (premierHints.has(key)) {
          return true;
        }
      }
    }

    return PREMIUM_FIELD_GROUP_IDS.length > 0 && this.queryTouchesCustomFilters(criteria);
  }

  private queryTouchesCustomFilters(criteria: AreaSearchPayload): boolean {
    const customFilters = criteria.customFilters;
    return !!customFilters && typeof customFilters === 'object' && Object.keys(customFilters).length > 0;
  }
}
