import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';
import { BillingProfile } from '@app/core/interfaces/api.interface';
import { SessionExpiredService } from '@app/core/services/session-expired.service';
import { SubscriptionService } from '@app/core/services/subscription.service';
import { VerticalService } from '@app/core/services/vertical.service';
import { ButtonComponent, CardComponent } from '@app/shared/components';

@Component({
  selector: 'app-subscription-card',
  standalone: true,
  imports: [CurrencyPipe, CardComponent, ButtonComponent],
  templateUrl: './subscription-card.component.html',
  host: {
    class: 'block h-full min-h-0'
  },
  styles: [
    `
      .subscription-scroll {
        scrollbar-width: thin;
        scrollbar-color: color-mix(in srgb, var(--color-border) 80%, transparent) transparent;
      }

      .subscription-scroll::-webkit-scrollbar {
        width: 6px;
      }

      .subscription-scroll::-webkit-scrollbar-thumb {
        background-color: color-mix(in srgb, var(--color-border) 80%, transparent);
        border-radius: 9999px;
      }

      .subscription-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
    `
  ]
})
export class SubscriptionCardComponent {
  private readonly authService = inject(AuthService);
  private readonly verticalService = inject(VerticalService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly sessionExpiredService = inject(SessionExpiredService);
  private readonly expandedProfileId = signal<string | null>(null);

  readonly heightLocked = input(true);
  readonly expandedChange = output<boolean>();

  readonly subscriptionEnabled = computed(
    () => this.verticalService.content()?.app_config?.support_wallet !== false
  );
  readonly activeSubscriptions = this.subscriptionService.activeSubscriptions;
  readonly history = this.subscriptionService.history;
  readonly loading = this.subscriptionService.loading;
  readonly cancelling = this.subscriptionService.cancelling;
  readonly error = this.subscriptionService.error;
  readonly hasActiveSubscription = this.subscriptionService.hasActiveSubscription;

  constructor() {
    effect(() => {
      this.sessionExpiredService.sessionRenewed();

      if (!this.subscriptionEnabled()) {
        return;
      }

      const userId = this.authService.getUserId();
      if (userId != null) {
        this.subscriptionService.fetchBillingProfile(userId);
      }
    });

    effect(() => {
      const subscriptions = this.activeSubscriptions();
      if (!subscriptions.length) {
        this.expandedProfileId.set(null);
        return;
      }

      const current = this.expandedProfileId();
      if (current && !subscriptions.some((sub) => sub.profile_id === current)) {
        this.expandedProfileId.set(null);
      }
    });

    effect(() => {
      this.expandedChange.emit(this.expandedProfileId() !== null);
    });
  }

  isExpanded(profileId?: string): boolean {
    return !!profileId && this.expandedProfileId() === profileId;
  }

  toggleSubscription(profileId?: string): void {
    if (!profileId) {
      return;
    }

    this.expandedProfileId.update((current) => (current === profileId ? null : profileId));
  }

  planTitle(subscription: BillingProfile): string {
    return this.subscriptionService.planTitle(subscription);
  }

  historyForProfile(subscription: BillingProfile): BillingProfile[] {
    return this.subscriptionService.historyForProfile(
      subscription.profile_id,
      this.history(),
      subscription
    );
  }

  paymentStatusLabel(status?: string): string {
    return this.subscriptionService.paymentStatusLabel(status);
  }

  isActiveStatus(status?: string): boolean {
    return this.subscriptionService.isActiveStatus(status);
  }

  displayField(value?: string | number | null): string {
    if (value == null || value === '') {
      return '—';
    }

    return String(value).trim();
  }

  statusBadgeClass(status?: string): string {
    const base = 'inline-flex rounded-full px-2 py-0.5 text-caption font-semibold uppercase tracking-wide';
    return this.isActiveStatus(status)
      ? `${base} bg-success/10 text-success`
      : `${base} bg-warning/10 text-warning`;
  }

  cancelSubscription(subscription: BillingProfile): void {
    const userId = this.authService.getUserId();
    const profileId = subscription.profile_id;

    if (userId == null || !profileId) {
      return;
    }

    const confirmed = window.confirm('Are you sure you want to cancel this Subscription?');
    if (!confirmed) {
      return;
    }

    this.subscriptionService.cancelSubscription(userId, profileId).subscribe({
      error: () => undefined
    });
  }
}
