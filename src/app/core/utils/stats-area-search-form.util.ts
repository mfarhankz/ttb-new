import { STATS_RANGE_FIELDS } from '@app/features/statistics/config/statistics.config';
import { StatsRangeFieldValue, TractStatsFormData, TractStatsInfo } from '@app/core/interfaces/statistics.interface';
import { MapDrawnGeometry } from '@app/features/map/services/ol-map.service';

function restoreRangeFieldForForm(apiRange: StatsRangeFieldValue): StatsRangeFieldValue {
  if (apiRange.match === 'From-To' && apiRange.value && typeof apiRange.value === 'object') {
    const range = apiRange.value as { from?: number | string; to?: number | string };
    return {
      match: 'Between',
      from: range.from,
      to: range.to
    };
  }

  return {
    match: apiRange.match ?? 'Between',
    from: apiRange.from,
    to: apiRange.to,
    value: apiRange.value
  };
}

export function restoreStatsFormFromPayload(
  payload: TractStatsFormData,
  info?: TractStatsInfo
): { formData: TractStatsFormData; groupType: 'sa_site_city' | 'sa_site_zip' } {
  const groupType =
    info?.groupType === 'sa_site_zip' || info?.groupType === 'sa_site_city'
      ? info.groupType
      : payload.sa_site_zip?.length
        ? 'sa_site_zip'
        : 'sa_site_city';

  const formData = createDefaultStatsFormData();
  formData.mm_fips_state_code = payload.mm_fips_state_code;
  formData.mm_fips_muni_code = payload.mm_fips_muni_code;
  formData.use_code_std = payload.use_code_std?.length ? [...payload.use_code_std] : formData.use_code_std;
  formData.tract_type = payload.tract_type ?? formData.tract_type;

  const groupValues = groupType === 'sa_site_city' ? payload.sa_site_city : payload.sa_site_zip;
  if (groupValues?.length) {
    const key = `${groupType}_value` as 'sa_site_city_value' | 'sa_site_zip_value';
    formData[key] = [...groupValues];
  }

  for (const field of STATS_RANGE_FIELDS) {
    const apiRange = payload[field.name];
    if (apiRange) {
      formData[field.name] = restoreRangeFieldForForm(apiRange);
    }
  }

  return { formData, groupType };
}

function isValidValue(value: unknown): boolean {
  if (value === 0) {
    return true;
  }

  if (value == null || value === '') {
    return false;
  }

  return String(value).trim() !== '';
}

type StatsRangeFieldName = (typeof STATS_RANGE_FIELDS)[number]['name'];

function includeRangeFieldData(
  fieldName: StatsRangeFieldName,
  fieldData: StatsRangeFieldValue | undefined,
  payload: TractStatsFormData
): boolean {
  if (!fieldData?.match) {
    return false;
  }

  if (fieldData.match === 'Between' || fieldData.match === 'From-To') {
    if (isValidValue(fieldData.from) || isValidValue(fieldData.to)) {
      payload[fieldName] = {
        match: 'From-To',
        value: {
          from: fieldData.from,
          to: fieldData.to
        }
      };
      return true;
    }
    return false;
  }

  if (isValidValue(fieldData.value)) {
    payload[fieldName] = {
      match: fieldData.match,
      value: fieldData.value
    };
    return true;
  }

  return false;
}

export function fixStatsRangePayload(payload: TractStatsFormData): void {
  for (const field of STATS_RANGE_FIELDS) {
    const isValid = includeRangeFieldData(field.name, payload[field.name], payload);
    if (!isValid) {
      delete payload[field.name];
    }
  }
}

export function buildTractStatsPayload(
  formData: TractStatsFormData,
  groupType: 'sa_site_city' | 'sa_site_zip',
  geometry?: MapDrawnGeometry
): TractStatsFormData {
  const payload: TractStatsFormData = {
    mm_fips_state_code: formData.mm_fips_state_code,
    mm_fips_muni_code: formData.mm_fips_muni_code,
    use_code_std: formData.use_code_std?.length ? [...formData.use_code_std] : undefined,
    tract_type: formData.tract_type
  };

  const groupValues = formData[`${groupType}_value` as keyof TractStatsFormData] as string[] | undefined;
  if (groupValues?.length) {
    payload[groupType] = [...groupValues];
  }

  for (const field of STATS_RANGE_FIELDS) {
    const rangeValue = formData[field.name];
    if (rangeValue) {
      payload[field.name] = { ...rangeValue };
    }
  }

  fixStatsRangePayload(payload);

  if (geometry?.match && geometry.value) {
    payload.geometry = {
      match: geometry.match,
      value: geometry.value
    };
  }

  return payload;
}

export function createDefaultStatsFormData(): TractStatsFormData {
  const rangeDefault = (): StatsRangeFieldValue => ({
    match: 'Between',
    from: undefined,
    to: undefined,
    value: undefined
  });

  return {
    use_code_std: ['RSFR', 'RCON', 'RNEC', 'RTWR'],
    tract_type: 'carrier_route',
    total_units: rangeDefault(),
    avg_price: rangeDefault(),
    turnover_rate: rangeDefault(),
    NOO_ratio: rangeDefault(),
    avg_yr_owned: rangeDefault()
  };
}
