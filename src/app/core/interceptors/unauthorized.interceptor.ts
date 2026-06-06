import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionExpiredService } from '../services/session-expired.service';

/**
 * Opens the in-app login modal when the session is no longer valid (HTTP 401).
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionExpiredService = inject(SessionExpiredService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        sessionExpiredService.openLoginModal();
      }
      return throwError(() => error);
    })
  );
};
