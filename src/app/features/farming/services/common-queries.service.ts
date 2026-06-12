import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '@app/core/config/api.config';
import { AreaSearchPayload } from '@app/core/interfaces/area-search-field.interface';
import { CommonAreaSearchQuery } from '@app/core/interfaces/area-search-query.interface';
import { ApiService } from '@app/core/services/api.service';

interface TtbCommonQueriesResponse {
  response: {
    status: string;
    message?: string;
    data?: CommonAreaSearchQuery[];
  };
}

@Injectable({ providedIn: 'root' })
export class CommonQueriesService {
  private readonly apiService = inject(ApiService);

  private readonly _queries = signal<CommonAreaSearchQuery[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly queries = this._queries.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  fetchList(): void {
    this._loading.set(true);
    this._error.set(null);

    this.apiService
      .postParsedJson<TtbCommonQueriesResponse>(API_CONFIG.endpoints.getCommonQueries, {}, {
        treatEmptyAs: { response: { status: 'OK', data: [] } }
      })
      .subscribe({
      next: (response) => {
        const payload = response.response;
        if (payload.status !== 'OK') {
          this._error.set(payload.message ?? 'Failed to load common queries.');
          this._queries.set([]);
        } else {
          this._queries.set(payload.data ?? []);
        }
        this._loading.set(false);
      },
      error: (err: Error) => {
        this._error.set(err.message ?? 'Failed to load common queries.');
        this._queries.set([]);
        this._loading.set(false);
      }
    });
  }

  saveQuery(name: string, query: AreaSearchPayload): Observable<unknown> {
    return this.apiService.post(API_CONFIG.endpoints.saveCommonQuery, { name, query });
  }

  renameQuery(queryId: string | number, newName: string): Observable<unknown> {
    return this.apiService.post(API_CONFIG.endpoints.renameCommonQuery, {
      query_id: queryId,
      new_name: newName
    });
  }

  removeQuery(queryId: string | number): Observable<unknown> {
    return this.apiService.post(API_CONFIG.endpoints.removeCommonQuery, { query_id: queryId });
  }

  refresh(): void {
    this.fetchList();
  }
}
