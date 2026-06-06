import { Injectable, signal } from '@angular/core';
import { UNAUTHORIZED_MESSAGE } from '../constants/auth.constants';

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
    return message === UNAUTHORIZED_MESSAGE || message.toLowerCase().includes('please login again');
  }

  handleUnauthorized(message?: string, status?: number): void {
    if (status === 401 || this.isUnauthorizedMessage(message)) {
      this.openLoginModal();
    }
  }
}
