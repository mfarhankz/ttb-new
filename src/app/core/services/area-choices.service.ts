import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { US_STATE_ABBREV_OPTIONS, US_STATE_FIPS_BY_ABBREV } from '../config/us-states.config';
import { CountyChoice } from '../interfaces/property-search.interface';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AreaChoicesService {
  private readonly apiService = inject(ApiService);

  getStateOptions(): { label: string; value: string }[] {
    return US_STATE_ABBREV_OPTIONS;
  }

  /** Legacy getStatesParsedSync — static FIPS map, no API call. */
  resolveStateFips(stateAbbrev: string): Observable<string | null> {
    return of(US_STATE_FIPS_BY_ABBREV[stateAbbrev] ?? null);
  }

  fetchCountiesForStateAbbrev(stateAbbrev: string): Observable<CountyChoice[]> {
    return this.resolveStateFips(stateAbbrev).pipe(
      switchMap((stateFips) => {
        if (!stateFips) {
          return of([]);
        }

        return this.fetchCountiesByFips(stateFips);
      })
    );
  }

  /** Legacy GET webservices/get_counties/{stateFips}.json */
  fetchCountiesByFips(stateFips: string): Observable<CountyChoice[]> {
    const endpoint = `${API_CONFIG.endpoints.getCounties}/${stateFips}.json`;

    // Do not pass treatEmptyAs — plain { "001": "ALAMEDA", ... } responses are misclassified as empty.
    return this.apiService
      .getParsedJson<unknown>(endpoint)
      .pipe(map((response) => this.parseCountyChoices(response)));
  }

  private parseCountyChoices(response: unknown): CountyChoice[] {
    const data = this.extractChoicesRecord(response);
    if (!data) {
      return [];
    }

    return Object.entries(data)
      .map(([key, value]) => ({
        key,
        value: String(value)
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  private extractChoicesRecord(response: unknown): Record<string, string> | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if (Array.isArray(response)) {
      const fromArray = Object.fromEntries(
        response
          .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
          .map((entry) => [entry, entry])
      );

      return Object.keys(fromArray).length ? fromArray : null;
    }

    const root = response as Record<string, unknown>;

    const envelope = root['response'];
    if (envelope && typeof envelope === 'object') {
      const data = (envelope as Record<string, unknown>)['data'];
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        return data as Record<string, string>;
      }
    }

    const entries = Object.entries(root).filter(([key]) => key !== 'response');
    if (
      entries.length &&
      entries.every(([, value]) => typeof value === 'string' || typeof value === 'number')
    ) {
      return Object.fromEntries(entries.map(([key, value]) => [key, String(value)]));
    }

    return null;
  }
}
