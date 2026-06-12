/**
 * Vertical / white-label resolution (mirrors legacy app.bootstrap.js).
 * Domain → vertical_meta → vertical_conf → optional agency overlay.
 *
 * Logo resolution (VerticalService):
 * - Production: each vertical/agency supplies logos via vertical_conf company_info
 *   (dashboard_logo_url, profile_logo, public_page_logo_url, logo_url).
 *   Server URLs take precedence when present — see dashboardLogoUrl / publicPageLogoUrl.
 * - Fallback: public/*.png below when a vertical has no dashboard/profile logo yet
 *   (demo vertical today). Theme variant picks light vs dark local assets.
 * - Do not use generic logo_url for the authenticated sidebar; it is for public pages only.
 */

export const VERTICAL_CONFIG = {
  /** Dev/demo fallback — light theme full logo (public/logo.png) */
  lightLogoPath: '/logo.png',
  /** Dev/demo fallback — light theme collapsed sidebar (public/short-logo.png) */
  lightShortLogoPath: '/short-logo.png',
  /** Dev/demo fallback — main/dark theme full logo (public/logo-dark.png) */
  darkLogoPath: '/logo-dark.png',
  /** Dev/demo fallback — main/dark theme collapsed sidebar (public/short-logo-dark.png) */
  darkShortLogoPath: '/short-logo-dark.png',
  /** Fallback support phone when vertical_conf has no support_info */
  defaultSupportPhone: '855-276-1159',
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
    'detail',
    'property-search',
    'farming',
    'statistics',
    'buyer-cost-estimate',
    'property-lead-alerts',
    'daily-lead-alerts',
    'admin',
    'manage-reports',
    'manage-account'
  ])
} as const;
