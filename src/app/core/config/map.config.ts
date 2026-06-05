/**
 * Map configuration – same defaults as Title Toolbox.
 * Google Maps API key: set in environment or use MAP_CONFIG.googleMapsApiKey.
 */

/** Default center: Irvine, CA (lon, lat) – EPSG:4326 */
export const DEFAULT_LON_LAT: [number, number] = [-117.844105, 33.683219];

export const MAP_DEFAULTS = {
  lonLat: DEFAULT_LON_LAT,
  zoom: 12,
  numZoomLevels: 20,
  zoomControls: true,
  mouseZoomEvent: true,
  markerDefaults: {
    lonLat: DEFAULT_LON_LAT,
    image: 'assets/images/_pin.png',
    height: 40,
    width: 29
  },
  popupDefaults: {
    width: 200,
    height: 80
  },
  /** Projection codes */
  projections: {
    geographic: 'EPSG:4326',
    proj3857: 'EPSG:3857'
  }
} as const;

/** Configurable Google Maps API key (e.g. from .env or environment). */
export const MAP_CONFIG = {
  /** Set via environment or replace with your key. Never commit real keys. */
  googleMapsApiKey: (typeof (window as any) !== 'undefined' && (window as any).__GOOGLE_MAPS_API_KEY__) || ''
};
