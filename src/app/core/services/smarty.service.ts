import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { SMARTY_CONFIG, SMARTY_VALIDATION_CACHE_KEY } from '../config/smarty.config';
import {
  SmartyAddressDetails,
  SmartyAutocompleteSuggestion,
  SmartyUSAddressResponse
} from '../interfaces/smarty.interface';
import { buildFullSiteAddressFromPlace } from '../utils/address-format.util';
import {
  buildSmartyFullAddress,
  buildSmartySelectionAddress,
  toSmartyUSAddressResponse
} from '../utils/smarty-address.util';
import { VerticalService } from './vertical.service';

interface SmartyAutocompleteApiResponse {
  suggestions?: SmartyAutocompleteSuggestion[];
}

interface AutocompleteCacheEntry {
  search: string;
  selected?: string;
  results: SmartyAutocompleteSuggestion[];
}

interface ValidationCacheEntry {
  street: string;
  results: SmartyUSAddressResponse[];
}

@Injectable({ providedIn: 'root' })
export class SmartyService {
  private readonly http = inject(HttpClient);
  private readonly verticalService = inject(VerticalService);

  private readonly autocompleteCache: AutocompleteCacheEntry[] = [];

  getSuggestions(search: string, selected?: string): Observable<SmartyAutocompleteSuggestion[]> {
    if (!search || search.length < SMARTY_CONFIG.minSearchLength) {
      return new Observable((subscriber) => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    const cached = this.autocompleteCache.find(
      (entry) => entry.search === search && entry.selected === selected
    );
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached.results);
        subscriber.complete();
      });
    }

    let params = new HttpParams()
      .set('max_results', '5')
      .set('search', search)
      .set('key', this.resolveApiKey());

    if (selected) {
      params = params.set('selected', selected);
    }

    return this.http
      .get<SmartyAutocompleteApiResponse>(SMARTY_CONFIG.autocompleteUrl, { params })
      .pipe(
        map((response) => {
          const results = (response.suggestions ?? []).map((suggestion) => ({
            ...suggestion,
            fullAddress: buildSmartyFullAddress(suggestion),
            fullAddressSelection: buildSmartySelectionAddress(suggestion)
          }));

          this.autocompleteCache.unshift({ search, selected, results });
          if (this.autocompleteCache.length > SMARTY_CONFIG.autocompleteCacheLimit) {
            this.autocompleteCache.pop();
          }

          return results;
        })
      );
  }

  validateAddress(addressString: string): Observable<SmartyUSAddressResponse[]> {
    const cache = this.readValidationCache();
    const cached = cache.find((entry) => entry.street === addressString);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached.results);
        subscriber.complete();
      });
    }

    const params = new HttpParams().set('street', addressString).set('key', this.resolveApiKey());

    return this.http
      .get<SmartyUSAddressResponse[]>(SMARTY_CONFIG.validationUrl, { params })
      .pipe(
        map((results) => {
          const nextCache = [{ street: addressString, results }, ...cache].slice(
            0,
            SMARTY_CONFIG.validationCacheLimit
          );
          localStorage.setItem(SMARTY_VALIDATION_CACHE_KEY, JSON.stringify(nextCache));
          return results;
        })
      );
  }

  toSmartyUSAddressResponse(suggestion: SmartyAutocompleteSuggestion): SmartyUSAddressResponse {
    return toSmartyUSAddressResponse(suggestion);
  }

  applySmartyAddress(smartyResult: SmartyUSAddressResponse | null | undefined): SmartyAddressDetails {
    const details: SmartyAddressDetails = {};
    if (!smartyResult) {
      return details;
    }

    const components = smartyResult.components ?? {};
    const metadata = smartyResult.metadata ?? {};

    details.site_street_number = components.primary_number || '';
    details.site_route = [components.street_predirection, components.street_name, components.street_suffix]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    details.site_address = [details.site_street_number, details.site_route].filter(Boolean).join(' ').trim();
    details.site_city = components.city_name || '';
    details.site_state = components.state_abbreviation || '';
    details.county = metadata.county_name ? `${metadata.county_name} County` : '';
    details.state_county_fips = metadata.county_fips;
    details.country = 'United States';
    details.site_zip = components.zipcode || '';
    details.site_unit = components.secondary_number || '';
    details.site_unit_full = [components.secondary_designator, components.secondary_number]
      .filter(Boolean)
      .join(' ')
      .trim();
    details.site_full_address = buildFullSiteAddressFromPlace(details, true);
    details.location = {
      lat: metadata.latitude,
      lng: metadata.longitude
    };
    details.smarty_delivery_point_barcode = smartyResult.delivery_point_barcode;

    return details;
  }

  cleanSkippedVerificationResponse(details: SmartyAddressDetails): SmartyAddressDetails {
    delete details.county;
    delete details.state_county_fips;
    delete details.location;
    delete details.smarty_delivery_point_barcode;
    return details;
  }

  private resolveApiKey(): string {
    const configured = this.verticalService.smartyApiKey();
    return configured || SMARTY_CONFIG.defaultApiKey;
  }

  private readValidationCache(): ValidationCacheEntry[] {
    try {
      const raw = localStorage.getItem(SMARTY_VALIDATION_CACHE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as ValidationCacheEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
