import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_CONFIG } from '@app/core/config/api.config';
import {
  CreditPurchaseSuccessData,
  PaymentErrorResult,
  PaymentStepPayload,
  RecsPurchaseSuccessData,
  TtbPaymentStepResponse
} from '@app/core/interfaces/payment.interface';
import { PlaSubscribeSuccessData } from '@app/authenticated/property-lead-alerts/interfaces/property-lead-alerts.interface';
import { ApiService } from '@app/core/services/api.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiService = inject(ApiService);

  purchaseRecsStep(payload: PaymentStepPayload): Observable<RecsPurchaseSuccessData> {
    return this.postPaymentStep<RecsPurchaseSuccessData>(API_CONFIG.endpoints.recsPurchase, payload);
  }

  purchaseCreditStep(payload: PaymentStepPayload): Observable<CreditPurchaseSuccessData> {
    return this.postPaymentStep<CreditPurchaseSuccessData>(API_CONFIG.endpoints.creditPurchase, payload);
  }

  createNewProfileStep(payload: PaymentStepPayload): Observable<PlaSubscribeSuccessData> {
    return this.postPaymentStep<PlaSubscribeSuccessData>(API_CONFIG.endpoints.createNewProfile, payload);
  }

  parsePaymentError(reason: unknown): PaymentErrorResult {
    if (!reason) {
      return {
        message: "Something's wrong, Please try again!",
        messages: null,
        isWarning: false
      };
    }

    if (typeof reason === 'string') {
      return { message: reason, messages: null, isWarning: false };
    }

    const envelope = this.unwrapPaymentEnvelope(reason);
    if (!envelope) {
      const message = reason instanceof Error ? reason.message : "Something's wrong, Please try again!";
      return { message, messages: null, isWarning: false };
    }

    const { status, data, message } = envelope;

    if (status === 'WARNING') {
      const warningData = data as { msg?: string } | undefined;
      return {
        message: warningData?.msg ?? message ?? "Something's wrong, Please try again!",
        messages: null,
        isWarning: true
      };
    }

    if (typeof data === 'string') {
      return { message: data, messages: null, isWarning: false };
    }

    if (Array.isArray(data) && data.every((item) => typeof item === 'string')) {
      return { message: null, messages: data, isWarning: false };
    }

    const nestedMessage =
      typeof (data as RecsPurchaseSuccessData | undefined)?.error === 'string'
        ? (data as RecsPurchaseSuccessData).error
        : null;

    return {
      message:
        nestedMessage ??
        message ??
        'Something went wrong. Please try again or report to the technical team.',
      messages: null,
      isWarning: false
    };
  }

  private postPaymentStep<T>(endpoint: string, payload: PaymentStepPayload): Observable<T> {
    return this.apiService.postParsedJson<TtbPaymentStepResponse<T>>(endpoint, payload).pipe(
      map((response) => {
        const body = response.response;
        if (!body || body.status !== 'OK') {
          throw body ?? { status: 'ERROR', data: 'Failed in processing request.' };
        }

        return (body.data ?? {}) as T;
      })
    );
  }

  private unwrapPaymentEnvelope(
    reason: unknown
  ): { status?: string; data?: unknown; message?: string } | null {
    if (!reason || typeof reason !== 'object') {
      return null;
    }

    const root = reason as Record<string, unknown>;
    if (root['response'] && typeof root['response'] === 'object') {
      return root['response'] as { status?: string; data?: unknown; message?: string };
    }

    if ('status' in root) {
      return root as { status?: string; data?: unknown; message?: string };
    }

    return null;
  }
}
