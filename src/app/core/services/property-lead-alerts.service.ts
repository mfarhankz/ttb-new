import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import {
  PLA_SUBSCRIPTION_PLAN
} from '../config/property-lead-alerts.config';
import { BillingProfile } from '../interfaces/api.interface';
import {
  PlaHistoryRecord,
  PlaSaveQueryRequest,
  TtbPlaHistoryResponse,
  TtbPlaSaveQueryResponse
} from '../interfaces/property-lead-alerts.interface';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { SubscriptionService } from './subscription.service';

@Injectable({ providedIn: 'root' })
export class PropertyLeadAlertsService {
  private readonly apiService = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly subscriptionService = inject(SubscriptionService);

  private readonly _plaSubscription = signal<BillingProfile | null>(null);
  private readonly _loadingSubscription = signal(false);
  private readonly _subscriptionError = signal<string | null>(null);

  readonly plaSubscription = this._plaSubscription.asReadonly();
  readonly loadingSubscription = this._loadingSubscription.asReadonly();
  readonly subscriptionError = this._subscriptionError.asReadonly();
  readonly hasActivePlaSubscription = computed(() => !!this._plaSubscription());

  loadSubscription(force = false): void {
    const userId = this.authService.tbUser()?.users_id;
    if (userId == null) {
      return;
    }

    this._loadingSubscription.set(true);
    this._subscriptionError.set(null);

    if (force) {
      this.subscriptionService.invalidateCache();
    }

    this.subscriptionService.fetchBillingProfile(userId, force);
  }

  syncFromBillingHistory(records: BillingProfile[]): void {
    this._loadingSubscription.set(this.subscriptionService.loading());
    this._subscriptionError.set(this.subscriptionService.error());
    this._plaSubscription.set(this.findPlaSubscription(records));
  }

  findPlaSubscription(records: BillingProfile[]): BillingProfile | null {
    return (
      records.find((record) => {
        if (String(record.plan ?? '').trim() !== PLA_SUBSCRIPTION_PLAN) {
          return false;
        }

        if (this.subscriptionService.isActiveStatus(record.status)) {
          return true;
        }

        const status = record.status?.trim().toLowerCase();
        if (status === 'cancelled') {
          const until = record.deny_access_date ?? record.access_allowed_until;
          return !!until && new Date(until) >= new Date();
        }

        return false;
      }) ?? null
    );
  }

  saveQuery(payload: PlaSaveQueryRequest): Observable<string> {
    return this.apiService.post<TtbPlaSaveQueryResponse>(API_CONFIG.endpoints.saveQueryForDla, payload).pipe(
      map((response) => {
        const body = response.response;
        if (!body || body.status !== 'OK') {
          throw new Error(body?.message ?? 'Failed to save Property Lead Alert search.');
        }

        return body.data?.msg ?? 'Search saved successfully.';
      }),
      catchError((err: Error) =>
        throwError(() => new Error(err.message ?? 'Failed to save Property Lead Alert search.'))
      )
    );
  }

  fetchHistory(): Observable<PlaHistoryRecord[]> {
    return this.apiService.get<TtbPlaHistoryResponse>(API_CONFIG.endpoints.getDlaHistory).pipe(
      map((response) => {
        const body = response.response;
        if (!body || body.status !== 'OK') {
          throw new Error(body?.message ?? 'Failed to load PLA history.');
        }

        return body.data ?? [];
      }),
      catchError((err: Error) =>
        throwError(() => new Error(err.message ?? 'Failed to load PLA history.'))
      )
    );
  }
}
