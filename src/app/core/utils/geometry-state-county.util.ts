import { MapDrawnGeometry } from '../services/ol-map.service';

interface GeometryLocationFips {
  mm_fips_state_code?: string;
}

function parseCircleCenter(geometry: MapDrawnGeometry): { lng: number; lat: number } | null {
  const lng = Number(geometry.value.center_lng);
  const lat = Number(geometry.value.center_lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }
  return { lng, lat };
}

function parsePolygonCenter(geometry: MapDrawnGeometry): { lng: number; lat: number } | null {
  const wkt = geometry.value.wkt;
  if (!wkt) {
    return null;
  }

  const match = wkt.match(/-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?/g);
  if (!match?.length) {
    return null;
  }

  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  for (const pair of match) {
    const [lngRaw, latRaw] = pair.split(/\s+/);
    const lng = Number(lngRaw);
    const lat = Number(latRaw);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      sumLng += lng;
      sumLat += lat;
      count++;
    }
  }

  if (!count) {
    return null;
  }

  return { lng: sumLng / count, lat: sumLat / count };
}

function resolveGeometryCenter(geometry: MapDrawnGeometry | undefined): { lng: number; lat: number } | null {
  if (!geometry?.match || !geometry.value) {
    return null;
  }

  if (geometry.match === 'circle') {
    return parseCircleCenter(geometry);
  }

  if (geometry.match === 'polygon') {
    return parsePolygonCenter(geometry);
  }

  return null;
}

export async function fetchStateCountyFromGeometry(
  geometry: MapDrawnGeometry | undefined
): Promise<GeometryLocationFips> {
  const center = resolveGeometryCenter(geometry);
  if (!center) {
    return {};
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}`;
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    const data = (await response.json()) as {
      address?: {
        state?: string;
        county?: string;
      };
    };

    const stateName = data.address?.state?.trim();
    if (!stateName) {
      return {};
    }

    const statesModule = await import('../config/us-states.config');
    const stateOption = statesModule.US_STATE_FIPS_OPTIONS.find(
      (option) => option.label.toLowerCase() === stateName.toLowerCase()
    );

    return {
      mm_fips_state_code: stateOption?.value
    };
  } catch {
    return {};
  }
}
