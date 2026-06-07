import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionExpiredService } from '../services/session-expired.service';

/**
 * Opens the in-app login modal when the session is no longer valid.
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionExpiredService = inject(SessionExpiredService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      sessionExpiredService.handleUnauthorized(
        typeof error.error === 'object' && error.error && 'message' in error.error
          ? String((error.error as { message?: string }).message ?? '')
          : undefined,
        error.status,
        error.url ?? req.url
      );
      return throwError(() => error);
    })
  );
};
