const TTBSID_PARAM = 'TTBSID';
const AUTH_TOKEN_KEY = 'authToken';

/** Skip session attachment for unauthenticated bootstrap endpoints. */
const SESSION_SKIP_PATTERNS = ['/login.json', '/vertical_meta.json', '/vertical_conf.json'];

export function attachTtbSessionId(url: string, sessionId: string): string {
  if (!sessionId || url.includes(`${TTBSID_PARAM}=`)) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${TTBSID_PARAM}=${encodeURIComponent(sessionId)}`;
}

export function shouldAttachTtbSession(url: string): boolean {
  if (!url.includes('/webservices/')) {
    return false;
  }

  return !SESSION_SKIP_PATTERNS.some((pattern) => url.includes(pattern));
}

export function getTtbSessionId(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
