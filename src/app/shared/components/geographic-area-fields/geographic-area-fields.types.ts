export type GeographicAreaGroupType = 'sa_site_city' | 'sa_site_zip';
export type GeographicAreaLayout = 'row' | 'row-2' | 'column';
/** `separate` — city and zip as their own fields; `grouped` — radio + one city/zip multiselect. */
export type GeographicAreaCityZipMode = 'separate' | 'grouped';
/** Control type for city/zip in `separate` mode. Grouped mode always uses multiselect. */
export type GeographicAreaCityZipControl = 'select' | 'multiselect' | 'text';

export interface GeographicAreaFieldsValue {
  stateFips?: string;
  countyFips?: string;
  /** State abbrev (e.g. CA) — set when selecting state in the component. */
  stateAbbrev?: string;
  /** County display name (e.g. ALAMEDA) — set when selecting county. */
  countyLabel?: string;
  /** Single city when `cityZipControl` is `select`. */
  siteCity?: string;
  /** Single zip when `cityZipControl` is `select`. */
  siteZip?: string;
  /** Multiple cities when `cityZipControl` is `multiselect` in separate mode. */
  siteCities?: string[];
  /** Multiple zips when `cityZipControl` is `multiselect` in separate mode. */
  siteZips?: string[];
  groupType?: GeographicAreaGroupType;
  groupValues?: string[];
}
