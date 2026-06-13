import { AREA_SEARCH_DEFAULT_MAX_LIMIT } from '@app/authenticated/farming/config/area-search-fields.config';

export const SEARCH_123_ROUTE = '/123-search';

export const SEARCH_123_DEFAULT_STATE_FIPS = '06';
export const SEARCH_123_DEFAULT_COUNTY_FIPS = '059';
export const SEARCH_123_DEFAULT_MAX_LIMIT = AREA_SEARCH_DEFAULT_MAX_LIMIT;
export const SEARCH_123_ALLOWED_MAX_LIMIT = 10000;

export type Search123Shape = 'circle' | 'polygon';
