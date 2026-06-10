import { Injectable, signal } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { PayNowOptions, PayNowResult } from '../interfaces/payment.interface';

@Injectable({ providedIn: 'root' })
export class PayNowModalService {
  private readonly _activeOptions = signal<PayNowOptions | null>(null);
  private pendingSubscriber: Subscriber<PayNowResult | null> | null = null;

  readonly activeOptions = this._activeOptions.asReadonly();

  open(options: PayNowOptions): Observable<PayNowResult | null> {
    return new Observable((subscriber) => {
      this.completePendingSubscriber();
      this.pendingSubscriber = subscriber;
      this._activeOptions.set(options);

      return () => {
        if (this.pendingSubscriber === subscriber) {
          this.pendingSubscriber = null;
        }
      };
    });
  }

  complete(result: PayNowResult): void {
    const options = this._activeOptions();
    options?.onSuccess?.(result);
    this._activeOptions.set(null);
    this.pendingSubscriber?.next(result);
    this.completePendingSubscriber();
  }

  dismiss(): void {
    this._activeOptions.set(null);
    this.pendingSubscriber?.next(null);
    this.completePendingSubscriber();
  }

  private completePendingSubscriber(): void {
    if (!this.pendingSubscriber) {
      return;
    }

    this.pendingSubscriber.complete();
    this.pendingSubscriber = null;
  }
}
