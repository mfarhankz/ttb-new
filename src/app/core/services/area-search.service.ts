import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { AreaSearchPayload } from '../interfaces/area-search-field.interface';
import {
  SaveQueryRequest,
  SendDataRequest,
  ShareQueryRequest
} from '../interfaces/area-search-query.interface';
import {
  GlobalSearchCountData,
  GlobalSearchResponseData,
  TtbGlobalSearchCountResponse,
  TtbGlobalSearchResponse
} from '../interfaces/global-search-response.interface';
import { SavedSearchRecord, TtbSavedQueriesResponse } from '../interfaces/saved-search.interface';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AreaSearchService {
  private readonly apiService = inject(ApiService);

  private readonly _countResult = signal<GlobalSearchCountData | null>(null);
  private readonly _countSending = signal(false);
  private readonly _recordsSending = signal(false);

  readonly countResult = this._countResult.asReadonly();
  readonly countSending = this._countSending.asReadonly();
  readonly recordsSending = this._recordsSending.asReadonly();

  getCount(payload: AreaSearchPayload): Observable<GlobalSearchCountData> {
    this._countSending.set(true);

    return this.apiService
      .postParsedJson<TtbGlobalSearchCountResponse>(API_CONFIG.endpoints.globalSearchCount, payload)
      .pipe(
        map((response) => {
          const data = response.response;
          if (!data || data.status !== 'OK') {
            throw new Error(data?.message ?? 'Failed to get record count.');
          }

          const countData = data.data ?? {};
          this._countResult.set(countData);
          this._countSending.set(false);
          return countData;
        }),
        catchError((err: Error) => {
          this._countSending.set(false);
          return throwError(() => err);
        })
      );
  }

  searchRecords(payload: AreaSearchPayload, page = 1, limit = 1000): Observable<GlobalSearchResponseData> {
    this._recordsSending.set(true);

    const endpoint = `${API_CONFIG.endpoints.globalSearch}?limit=${limit}&page=${page}`;
    return this.apiService.postParsedJson<TtbGlobalSearchResponse>(endpoint, payload).pipe(
      map((response) => {
        const data = response.response;
        if (!data || data.status !== 'OK') {
          throw new Error(data?.message ?? 'Failed to load search records.');
        }

        this._recordsSending.set(false);
        return data.data ?? {};
      }),
      catchError((err: Error) => {
        this._recordsSending.set(false);
        return throwError(() => err);
      })
    );
  }

  saveQuery(request: SaveQueryRequest): Observable<unknown> {
    return this.apiService.post(API_CONFIG.endpoints.saveQuery, request);
  }

  getSavedQuery(queryId: string | number): Observable<SavedSearchRecord> {
    const endpoint = `${API_CONFIG.endpoints.getSavedQueryById}/${queryId}.json?t=${Date.now()}`;
    return this.apiService.getParsedJson<TtbSavedQueriesResponse>(endpoint).pipe(
      map((response) => {
        const payload = response.response;
        if (payload.status !== 'OK' || !payload.data?.length) {
          throw new Error(payload.message ?? 'Saved search not found.');
        }

        return payload.data[0];
      })
    );
  }

  shareQuery(request: ShareQueryRequest): Observable<unknown> {
    return this.apiService.post(API_CONFIG.endpoints.sendData, request);
  }

  sendData(request: SendDataRequest): Observable<unknown> {
    return this.apiService.post(API_CONFIG.endpoints.sendData, request);
  }

  purchaseRecs(payload: AreaSearchPayload): Observable<unknown> {
    return this.apiService.post(API_CONFIG.endpoints.recsPurchase, payload);
  }

  clearGlobalSearch(): Observable<unknown> {
    return this.apiService.get(`${API_CONFIG.endpoints.clearGlobalSearch}?t=${Date.now()}`);
  }

  clearCountResult(): void {
    this._countResult.set(null);
  }

  updateResult(
    payload: {
      searchOptions: {
        omit_sa_property_ids?: number[];
        include_sa_property_ids?: number[];
      };
    },
    page = 1,
    limit = 1000
  ): Observable<GlobalSearchResponseData> {
    const endpoint = `${API_CONFIG.endpoints.updateResult}?limit=${limit}&page=${page}`;

    return this.apiService.postParsedJson<TtbGlobalSearchResponse>(endpoint, payload).pipe(
      map((response) => {
        const data = response.response;
        if (!data || data.status !== 'OK') {
          throw new Error(data?.message ?? 'Failed to update search results.');
        }

        const result = data.data ?? {};
        if (!result.recs?.length) {
          throw new Error('0 properties found against given search criteria.');
        }

        return result;
      }),
      catchError((err: Error) => throwError(() => err))
    );
  }
}
