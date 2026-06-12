import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { ApiService } from '@app/core/services/api.service';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  BillingProfile,
  TtbBillingProfileResponse,
  TtbSubscriptionOptionsResponse
} from '@app/core/interfaces/api.interface';
import { VerticalService } from '@app/core/services/vertical.service';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly apiService = inject(ApiService);
  private readonly verticalService = inject(VerticalService);

  private readonly _history = signal<BillingProfile[]>([]);
  private readonly _activeSubscriptions = signal<BillingProfile[]>([]);
  private readonly _subscriptionOptions = signal<Record<string, string>>({});
  private readonly _loading = signal(false);
  private readonly _cancelling = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly history = this._history.asReadonly();
  readonly activeSubscriptions = this._activeSubscriptions.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly cancelling = this._cancelling.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasActiveSubscription = computed(() => this._activeSubscriptions().length > 0);

  private loadSucceeded = false;
  private loadedUserId: number | string | null = null;

  invalidateCache(): void {
    this.loadSucceeded = false;
  }

  fetchBillingProfile(userId: number | string, force = false): void {
    if (!force && this.loadSucceeded && this.loadedUserId === userId) {
      return;
    }

    this.loadedUserId = userId;
    this._loading.set(true);
    this._error.set(null);

    if (force || !this.loadSucceeded) {
      this._history.set([]);
      this._activeSubscriptions.set([]);
    }

    forkJoin({
      billing: this.apiService.post<TtbBillingProfileResponse>(API_CONFIG.endpoints.showBillingProfile, {
        user_id: userId
      }),
      options: this.loadSubscriptionOptions()
    }).subscribe({
      next: ({ billing, options }) => {
        const response = billing.response;

        if (response.status !== 'OK') {
          this.loadSucceeded = false;
          this._error.set(response.message ?? 'Failed to load subscription.');
          this._loading.set(false);
          return;
        }

        this._subscriptionOptions.set(options);
        const records = this.normalizeRecords(response.data);

        this._history.set(records);
        this._activeSubscriptions.set(this.extractActiveSubscriptions(records));
        this.loadSucceeded = true;
        this._loading.set(false);
      },
      error: (err) => {
        this.loadSucceeded = false;
        this._error.set(err.message ?? 'Failed to load subscription.');
        this._loading.set(false);
      }
    });
  }

  cancelSubscription(userId: number | string, profileId: string): Observable<void> {
    this._cancelling.set(true);
    this._error.set(null);

    return this.apiService
      .post<TtbBillingProfileResponse>(API_CONFIG.endpoints.cancelSubscription, {
        TbBilling: {
          user_id: userId,
          profile_id: profileId
        }
      })
      .pipe(
        map((res) => {
          if (res.response?.status !== 'OK') {
            throw new Error(res.response?.message ?? 'Failed to cancel subscription.');
          }
          this._cancelling.set(false);
          this.fetchBillingProfile(userId, true);
        }),
        catchError((err) => {
          this._cancelling.set(false);
          this._error.set(err.message ?? 'Failed to cancel subscription.');
          return throwError(() => err);
        })
      );
  }

  historyForProfile(
    profileId: string | undefined,
    records: BillingProfile[] = this._history(),
    fallback?: BillingProfile
  ): BillingProfile[] {
    if (profileId) {
      const matched = records.filter((record) => record.profile_id?.trim() === profileId.trim());
      if (matched.length) {
        return matched;
      }
    }

    if (fallback?.plan) {
      const matchedByPlan = records.filter((record) => record.plan?.trim() === fallback.plan?.trim());
      if (matchedByPlan.length) {
        return matchedByPlan;
      }
    }

    if (
      fallback &&
      (fallback.last_payment_date ||
        fallback.last_payment_amount != null ||
        fallback.status)
    ) {
      return [fallback];
    }

    return [];
  }

  isActiveStatus(status?: string): boolean {
    return status?.trim().toLowerCase() === 'active';
  }

  paymentStatusLabel(status?: string): string {
    return this.isActiveStatus(status) ? 'PAID' : 'SCHEDULED';
  }

  planTitle(subscription: BillingProfile): string {
    const resolved = this.resolvePlanName(subscription);
    if (resolved) {
      return this.withVerticalSuffix(resolved);
    }

    const plan = subscription.plan?.trim();
    if (!plan) {
      return 'Monthly Subscription - $30 per month';
    }

    if (/subscription/i.test(plan)) {
      return this.withVerticalSuffix(plan);
    }

    return this.withVerticalSuffix(`${plan} Subscription`);
  }

  private loadSubscriptionOptions(): Observable<Record<string, string>> {
    const cached = this._subscriptionOptions();
    if (Object.keys(cached).length) {
      return of(cached);
    }

    return this.apiService.get<TtbSubscriptionOptionsResponse>(API_CONFIG.endpoints.listSubscriptionOptions).pipe(
      map((res) => {
        if (res.response?.status !== 'OK') {
          return {};
        }

        return this.normalizeSubscriptionOptions(res.response.data);
      }),
      catchError(() => of({}))
    );
  }

  private resolvePlanName(subscription: BillingProfile): string | null {
    const serviceName = subscription.subscribed_service?.service_name?.trim();
    if (serviceName) {
      return serviceName;
    }

    const serviceFromList = subscription.subscribed_services
      ?.map((service) => service.service_name?.trim())
      .find(Boolean);
    if (serviceFromList) {
      return serviceFromList;
    }

    const plan = subscription.plan?.trim();
    if (!plan) {
      return null;
    }

    const options = this._subscriptionOptions();
    return options[plan] ?? options[String(Number(plan))] ?? null;
  }

  private withVerticalSuffix(label: string): string {
    const vertical = this.verticalService.verticalName()?.trim();
    if (!vertical) {
      return label;
    }

    const suffix = ` - ${vertical}`;
    if (label.toLowerCase().includes(suffix.toLowerCase())) {
      return label;
    }

    return `${label}${suffix}`;
  }

  private normalizeSubscriptionOptions(
    data: Record<string, string> | string[] | undefined
  ): Record<string, string> {
    if (!data) {
      return {};
    }

    if (Array.isArray(data)) {
      return data.reduce<Record<string, string>>((acc, label, index) => {
        if (label) {
          acc[String(index)] = label;
        }
        return acc;
      }, {});
    }

    return data;
  }

  private extractActiveSubscriptions(records: BillingProfile[]): BillingProfile[] {
    const grouped = new Map<string, BillingProfile[]>();

    records.forEach((record, index) => {
      const profileId =
        record.profile_id?.trim() ||
        record.plan?.trim() ||
        `subscription-${index}`;

      const group = grouped.get(profileId) ?? [];
      group.push(record);
      grouped.set(profileId, group);
    });

    const active: BillingProfile[] = [];
    for (const group of grouped.values()) {
      if (this.isActiveProfileGroup(group)) {
        active.push(this.pickRepresentativeRecord(group));
      }
    }

    return active;
  }

  private isActiveProfileGroup(group: BillingProfile[]): boolean {
    if (group.some((record) => this.isActiveStatus(record.status))) {
      return true;
    }

    const allCancelled = group.every((record) => this.isCancelledStatus(record.status));
    if (allCancelled) {
      return this.isWithinGracePeriod(this.pickRepresentativeRecord(group));
    }

    return group.length > 0;
  }

  private isCancelledStatus(status?: string): boolean {
    return status?.trim().toLowerCase() === 'cancelled';
  }

  private isWithinGracePeriod(record: BillingProfile): boolean {
    const until = record.deny_access_date ?? record.access_allowed_until;
    if (!until) {
      return false;
    }

    return new Date(until) >= new Date();
  }

  private pickRepresentativeRecord(group: BillingProfile[]): BillingProfile {
    const active = group.find((record) => this.isActiveStatus(record.status));
    if (active) {
      return active;
    }

    const notCancelled = group.find((record) => !this.isCancelledStatus(record.status));
    if (notCancelled) {
      return notCancelled;
    }

    return group.reduce((latest, current) => {
      const latestDate = latest.last_payment_date ?? latest.profile_start_date ?? '';
      const currentDate = current.last_payment_date ?? current.profile_start_date ?? '';
      return currentDate > latestDate ? current : latest;
    });
  }

  private normalizeRecords(
    data: BillingProfile[] | Record<string, BillingProfile> | undefined
  ): BillingProfile[] {
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data;
    }

    return Object.values(data);
  }
}
