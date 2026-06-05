import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { VerticalService } from '../services/vertical.service';

/** Attach Partner-Key header for vertical API requests (legacy TTB behavior). */
export const partnerKeyInterceptor: HttpInterceptorFn = (req, next) => {
  const vertical = inject(VerticalService);
  const key = vertical.partnerKey();

  if (key && vertical.isVerticalApiRequest(req.url)) {
    return next(
      req.clone({
        setHeaders: { 'Partner-Key': key }
      })
    );
  }

  return next(req);
};
