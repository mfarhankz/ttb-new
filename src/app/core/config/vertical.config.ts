/**
 * Vertical / white-label resolution (mirrors legacy app.bootstrap.js).
 * Domain → vertical_meta → vertical_conf → optional agency overlay.
 */

export const VERTICAL_CONFIG = {
  /** Default full logo served from public/logo.png */
  defaultLogoPath: '/logo.png',
  /** Compact logo for collapsed sidebar (public/short-logo.png) */
  defaultShortLogoPath: '/short-logo.png',
  /** Meta is always resolved via demo API (legacy behavior) */
  metaApiOrigin: 'https://demo.api.titletoolbox.com',
  metaEndpoint: '/webservices/vertical_meta.json',
  /** Relative to API origin (legacy: BASE_URL + 'webservices/vertical_conf.json') */
  confEndpoint: 'webservices/vertical_conf.json',
  agencyEndpoint: 'webservices/get_agency',
  defaultVerticalName: 'demo',
  /** Localhost dev: skip meta API and use demo vertical */
  localhostDomains: ['localhost', '127.0.0.1'],
  localhostMeta: {
    vertical_name: 'demo',
    vertical_api_url: 'demo.api.titletoolbox.com',
    partner_key: '1-7a32b4f2-62a8-4990-830b-2cf674504875'
  },
  /** Query param for dev vertical testing (?vertical_domain=demo.titletoolbox.com) */
  verticalDomainQueryParam: 'vertical_domain',
  /** App routes — first path segment is NOT an agency slug when matched */
  reservedPathSegments: new Set([
    '',
    'login',
    'signup',
    'forgot-password',
    'dashboard',
    'property-search',
    'farming',
    'statistics',
    'buyer-cost-estimate',
    'daily-lead-alerts',
    'admin',
    'manage-reports',
    'manage-account'
  ])
} as const;
