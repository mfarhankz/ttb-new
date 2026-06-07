import { Injectable, signal } from '@angular/core';
import { UNAUTHORIZED_MESSAGE } from '../constants/auth.constants';
import { getTtbSessionId } from '../utils/ttb-session.util';

@Injectable({
  providedIn: 'root'
})
export class SessionExpiredService {
  private readonly _loginModalOpen = signal(false);
  private readonly _sessionRenewed = signal(0);

  readonly loginModalOpen = this._loginModalOpen.asReadonly();
  /** Increments after a successful session-expired re-login (legacy: session-renewed). */
  readonly sessionRenewed = this._sessionRenewed.asReadonly();

  openLoginModal(): void {
    if (!this._loginModalOpen()) {
      this._loginModalOpen.set(true);
    }
  }

  closeLoginModal(): void {
    this._loginModalOpen.set(false);
  }

  notifySessionRenewed(): void {
    this._sessionRenewed.update((count) => count + 1);
  }

  isUnauthorizedMessage(message: string | undefined | null): boolean {
    if (!message) {
      return false;
    }

    if (message === UNAUTHORIZED_MESSAGE) {
      return true;
    }

    const normalized = message.toLowerCase();
    const patterns = [
      'please login again',
      'please log in again',
      'log in again',
      'login again',
      'session may have expired',
      'session has expired',
      'session expired',
      'not logged in',
      'not authorised',
      'not authorized',
      'unauthorized',
      'invalid session',
      'invalid ttbsid',
      'authentication required',
      'login required'
    ];

    return patterns.some((pattern) => normalized.includes(pattern));
  }

  handleUnauthorized(message?: string, status?: number, requestUrl?: string): void {
    if (status === 401 || status === 403 || this.isUnauthorizedMessage(message)) {
      this.openLoginModal();
      return;
    }

    // Expired TTBSID often surfaces as a failed webservices call (status 0) while the app still has a stored token.
    if (
      status === 0 &&
      !!getTtbSessionId() &&
      requestUrl?.includes('/webservices/')
    ) {
      this.openLoginModal();
    }
  }
}
