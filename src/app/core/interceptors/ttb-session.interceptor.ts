import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { VerticalService } from '../services/vertical.service';
import {
  attachTtbSessionId,
  getTtbSessionId,
  shouldAttachTtbSession
} from '../utils/ttb-session.util';

/**
 * Legacy TTB auth: session via TTBSID cookie and/or query param (not Bearer tokens).
 */
export const ttbSessionInterceptor: HttpInterceptorFn = (req, next) => {
  const vertical = inject(VerticalService);

  if (!vertical.isVerticalApiRequest(req.url) || !shouldAttachTtbSession(req.url)) {
    return next(req);
  }

  const sessionId = getTtbSessionId();
  const url = sessionId ? attachTtbSessionId(req.url, sessionId) : req.url;

  return next(
    req.clone({
      url,
      withCredentials: true
    })
  );
};
