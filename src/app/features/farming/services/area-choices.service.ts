import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '@app/core/config/api.config';
import { CountyChoice } from '@app/core/interfaces/property-search.interface';
import {
  extractChoicesRecord,
  mapChoicesRecordToSortedOptions
} from '@app/core/utils/area-choices-response.util';
import { ApiService } from '@app/core/services/api.service';

@Injectable({ providedIn: 'root' })
export class AreaChoicesService {
  private readonly apiService = inject(ApiService);

  fetchCitiesByFips(stateFips: string, countyFips: string): Observable<CountyChoice[]> {
    const endpoint = `/get_cities/${stateFips}${countyFips}.json`;
    return this.apiService
      .getParsedJson<unknown>(endpoint)
      .pipe(map((response) => this.parseCountyChoices(response)));
  }

  fetchZipCodesByFips(stateFips: string, countyFips: string): Observable<CountyChoice[]> {
    const endpoint = `/get_zipcodes/${stateFips}${countyFips}.json`;
    return this.apiService
      .getParsedJson<unknown>(endpoint)
      .pipe(map((response) => this.parseCountyChoices(response)));
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
    const data = extractChoicesRecord(response);
    if (!data) {
      return [];
    }

    return mapChoicesRecordToSortedOptions(data);
  }
}
