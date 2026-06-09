import {
  coerceScalarFieldValue,
  normalizeChoiceFormValue,
  normalizeEmDefaultValue,
  resolveChoiceTreeDefaultValue
} from './area-search-field-meta.util';
import {
  AREA_SEARCH_CUSTOM_FILTERS_GROUP_ID,
  AREA_SEARCH_NO_DEFAULT_FIELDS,
  AREA_SEARCH_DATE_MATCH_OPTIONS,
  AREA_SEARCH_RANGE_DEFAULT_OPTION_INDEX,
  AREA_SEARCH_RANGE_MATCH_OPTIONS,
  AREA_SEARCH_WILDCARD_DEFAULT_OPTION_INDEX,
  AREA_SEARCH_WILDCARD_MATCH_OPTIONS
} from '../config/area-search-fields.config';
import {
  AreaSearchFieldGroup,
  AreaSearchFieldMeta,
  AreaSearchFieldsInfo,
  AreaSearchFormData,
  AreaSearchFormFieldValue,
  AreaSearchPayload
} from '../interfaces/area-search-field.interface';

function isValidValue(value: unknown): boolean {
  if (value === 0) {
    return true;
  }

  if (value == null || value === '') {
    return false;
  }

  if (typeof value === 'object') {
    return false;
  }

  return String(value).trim() !== '';
}

function isDateValue(value: unknown): boolean {
  return value instanceof Date || (value != null && String(value).indexOf('00Z') >= 0);
}

function formatSendableDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getSendableValue(value: unknown): unknown {
  if (value) {
    return isDateValue(value) ? formatSendableDate(value as Date) : value;
  }

  return value === 0 ? 0 : undefined;
}

function includeChoiceFieldData(fieldName: string, fieldData: AreaSearchFormFieldValue, payload: AreaSearchPayload): void {
  if (fieldData.value && fieldData.value !== '_blank_') {
    payload[fieldName] = fieldData.value;
  }
}

function includeChoiceMultipleFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload
): void {
  if (Array.isArray(fieldData.value) && fieldData.value.length) {
    payload[fieldName] = fieldData.value;
    return;
  }

  if (typeof fieldData.value === 'string' && fieldData.value) {
    payload[fieldName] = fieldData.value;
  }
}

function includeChoiceTreeFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload
): void {
  if (Array.isArray(fieldData.value) && fieldData.value.length) {
    payload[fieldName] = fieldData.value;
  }
}

function includeCheckboxesFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload
): void {
  if (Array.isArray(fieldData.value) && fieldData.value.length) {
    payload[fieldName] = fieldData.value;
  }
}

function includeRadioButtonsFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload,
  fieldsInfo: AreaSearchFieldsInfo
): void {
  if (!fieldData.value) {
    return;
  }

  const fieldInfo = fieldsInfo[fieldName];
  if (!fieldInfo?.choices || typeof fieldInfo.choices !== 'object') {
    return;
  }

  const allChoicesKeys = Object.keys(fieldInfo.choices);
  let finalValue: string[];

  if (fieldData.value === '$') {
    finalValue = allChoicesKeys.filter((key) => key !== '$');
  } else {
    finalValue = [String(fieldData.value)];
  }

  if (!finalValue.length || typeof finalValue[0] !== 'string') {
    return;
  }

  payload.searchOptions = payload.searchOptions ?? {};
  payload.searchOptions.include_contact_info = finalValue;
}

function includeRangeFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload
): void {
  if (fieldData.match === 'Between' || fieldData.match === 'From-To') {
    if (isValidValue(fieldData.from) || isValidValue(fieldData.to)) {
      payload[fieldName] = {
        match: 'From-To',
        value: {
          from: getSendableValue(fieldData.from),
          to: getSendableValue(fieldData.to)
        }
      };
    }
    return;
  }

  if (isValidValue(fieldData.value)) {
    payload[fieldName] = {
      match: fieldData.match,
      value: getSendableValue(fieldData.value)
    };
  }
}

function includeWildcardFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload
): void {
  if (isValidValue(fieldData.value)) {
    payload[fieldName] = {
      match: fieldData.match,
      value: fieldData.value
    };
  }
}

function includeExactMatchFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload
): void {
  if (isValidValue(fieldData.value)) {
    payload[fieldName] = getSendableValue(fieldData.value);
  }
}

function includeGeometryFieldData(
  fieldName: string,
  fieldData: AreaSearchFormFieldValue,
  payload: AreaSearchPayload
): void {
  if (fieldData.match) {
    payload[fieldName] = {
      match: fieldData.match,
      value: fieldData.value
    };
  }
}

export function flatCustomFilters(criteria: AreaSearchPayload): AreaSearchPayload {
  if (!criteria.customFilters) {
    return criteria;
  }

  for (const [filterFieldName, filterFieldValue] of Object.entries(criteria.customFilters)) {
    criteria[filterFieldName] = filterFieldValue;
    delete criteria.customFilters[filterFieldName];
  }

  return criteria;
}

export function parseFormData(
  formData: AreaSearchFormData,
  fieldGroups: AreaSearchFieldGroup[] | null,
  fieldsInfo: AreaSearchFieldsInfo,
  payload: AreaSearchPayload = {}
): AreaSearchPayload {
  payload.searchOptions = payload.searchOptions ?? {};
  payload.customFilters = payload.customFilters ?? {};

  for (const [fieldName, fieldData] of Object.entries(formData)) {
    if (!fieldData) {
      continue;
    }

    if (fieldName === 'omit_saved_records') {
      payload.searchOptions.omit_saved_records = !!fieldData.value;
      continue;
    }

    if (fieldName === 'max_limit') {
      if (fieldData.check && fieldData.value) {
        payload.searchOptions.max_limit = Number(fieldData.value);
      }
      continue;
    }

    switch (fieldData.search_type) {
      case 'C':
        includeChoiceFieldData(fieldName, fieldData, payload);
        break;
      case 'CM':
        includeChoiceMultipleFieldData(fieldName, fieldData, payload);
        break;
      case 'CT':
        includeChoiceTreeFieldData(fieldName, fieldData, payload);
        break;
      case 'CHB':
        includeCheckboxesFieldData(fieldName, fieldData, payload);
        break;
      case 'RDB':
        includeRadioButtonsFieldData(fieldName, fieldData, payload, fieldsInfo);
        break;
      case 'R':
        includeRangeFieldData(fieldName, fieldData, payload);
        break;
      case 'W':
        includeWildcardFieldData(fieldName, fieldData, payload);
        break;
      case 'EM':
        includeExactMatchFieldData(fieldName, fieldData, payload);
        break;
      case 'geometry':
        includeGeometryFieldData(fieldName, fieldData, payload);
        break;
      default:
        payload[fieldName] = { ...fieldData };
    }
  }

  if (!fieldGroups) {
    return payload;
  }

  const customFiltersGroup = fieldGroups.find((group) => group.group_id === AREA_SEARCH_CUSTOM_FILTERS_GROUP_ID);
  if (!customFiltersGroup) {
    return payload;
  }

  for (const input of customFiltersGroup.fields) {
    const fieldName = input.field_name;
    const fieldValue = formData[fieldName];
    if (fieldValue?.value === 'Y') {
      payload.customFilters[fieldName] = fieldValue.value;
      delete payload[fieldName];
    }
  }

  return payload;
}

function covertToPdtDate(dateString: string): Date {
  return new Date(`${dateString.substring(0, 10)}T07:00:00.000Z`);
}

function transformRangeFieldData(valueType: string | undefined, model: AreaSearchFormFieldValue): void {
  if (valueType !== 'date') {
    return;
  }

  switch (model.match) {
    case 'Between':
    case 'From-To':
      if (model.from) {
        model.from = covertToPdtDate(String(model.from));
      }
      if (model.to) {
        model.to = covertToPdtDate(String(model.to));
      }
      break;
    case 'Last_x_Months':
      break;
    default:
      if (model.value) {
        model.value = covertToPdtDate(String(model.value));
      }
  }
}

export function translateRdbValue(
  fieldValue: string[] | string | undefined,
  choices: Record<string, string>
): string | undefined {
  if (!fieldValue) {
    return fieldValue as undefined;
  }

  if (Array.isArray(fieldValue)) {
    const allKeys = Object.keys(choices);
    return fieldValue.length === allKeys.length - 1 ? '$' : fieldValue[0];
  }

  return fieldValue;
}

export function payloadToFormData(
  payload: AreaSearchPayload,
  formData: AreaSearchFormData,
  fieldsInfo: AreaSearchFieldsInfo
): AreaSearchFormData {
  if (payload.geometry) {
    payload.geometry.search_type = 'geometry';
    formData.geometry = payload.geometry as AreaSearchFormFieldValue;
  }

  formData.omit_saved_records = formData.omit_saved_records ?? {};
  formData.omit_saved_records.value = !!payload.searchOptions?.omit_saved_records;

  formData.max_limit = formData.max_limit ?? {};
  formData.max_limit.value = payload.searchOptions?.max_limit ?? undefined;
  formData.max_limit.check = !!payload.searchOptions?.max_limit;

  const nonFieldSearchOptions = ['omit_saved_records', 'max_limit'];

  if (payload.searchOptions) {
    for (const [fieldName, fieldValue] of Object.entries(payload.searchOptions)) {
      const fieldInfo = fieldsInfo[fieldName];
      if (nonFieldSearchOptions.includes(fieldName) || !fieldInfo) {
        continue;
      }

      formData[fieldName] = formData[fieldName] ?? {
        search_type: fieldInfo.search_type,
        value: undefined
      };

      if (
        fieldInfo.search_type === 'RDB' &&
        fieldInfo.choices &&
        typeof fieldInfo.choices === 'object' &&
        !Array.isArray(fieldInfo.choices)
      ) {
        formData[fieldName].value = translateRdbValue(
          fieldValue as string[],
          fieldInfo.choices as Record<string, string>
        );
      } else {
        formData[fieldName].value = fieldValue;
      }
    }
  }

  for (const fieldInfo of Object.values(fieldsInfo)) {
    const fieldName = fieldInfo.field_name;
    let fieldData = payload[fieldName] as
      | string
      | string[]
      | { match?: string; value?: unknown }
      | undefined;

    formData[fieldName] = formData[fieldName] ?? {};
    formData[fieldName].search_type = fieldInfo.search_type;

    if (!fieldData && payload.customFilters?.[fieldName]) {
      fieldData = payload.customFilters[fieldName] as typeof fieldData;
    }

    switch (fieldInfo.search_type) {
      case 'C':
        formData[fieldName].value = normalizeChoiceFormValue(fieldData ?? fieldInfo.default_value);
        break;

      case 'CM':
      case 'CT': {
        const defaultValue = resolveChoiceTreeDefaultValue(fieldInfo.default_value);
        formData[fieldName].value = (fieldData as string[] | undefined) ?? (defaultValue ? [...defaultValue] : undefined);
        break;
      }

      case 'CHB':
        formData[fieldName].value = (fieldData as string[] | undefined) ?? undefined;
        break;

      case 'R': {
        const rangeData = fieldData as { match?: string; value?: unknown } | undefined;
        if (rangeData?.match === 'From-To') {
          formData[fieldName].match = 'Between';
          formData[fieldName].value = undefined;
          const rangeValue = rangeData.value as { from?: unknown; to?: unknown } | undefined;
          const defaultValue = (fieldInfo.default_value as { value?: { from?: unknown; to?: unknown } } | undefined)?.value;
          formData[fieldName].from = rangeValue?.from ?? defaultValue?.from;
          formData[fieldName].to = rangeValue?.to ?? defaultValue?.to;
        } else {
          const matchOptions =
            fieldInfo.value_type === 'date'
              ? AREA_SEARCH_DATE_MATCH_OPTIONS
              : AREA_SEARCH_RANGE_MATCH_OPTIONS;
          const defaultMatch = (fieldInfo.default_value as { match?: string } | undefined)?.match;
          formData[fieldName].match =
            rangeData?.match ?? defaultMatch ?? matchOptions[AREA_SEARCH_RANGE_DEFAULT_OPTION_INDEX].value;
          const defaultValue = (fieldInfo.default_value as { value?: unknown } | undefined)?.value;
          formData[fieldName].value = rangeData?.value ?? defaultValue;
          formData[fieldName].from = undefined;
          formData[fieldName].to = undefined;
        }
        transformRangeFieldData(fieldInfo.value_type, formData[fieldName]);
        break;
      }

      case 'W': {
        const wildcardData = fieldData as { match?: string; value?: unknown } | undefined;
        const defaultMatch = (fieldInfo.default_value as { match?: string } | undefined)?.match;
        formData[fieldName].match =
          wildcardData?.match ??
          defaultMatch ??
          AREA_SEARCH_WILDCARD_MATCH_OPTIONS[AREA_SEARCH_WILDCARD_DEFAULT_OPTION_INDEX];
        const defaultValue = (fieldInfo.default_value as { value?: unknown } | undefined)?.value;
        formData[fieldName].value = coerceScalarFieldValue(wildcardData?.value ?? defaultValue);
        break;
      }

      case 'EM':
        formData[fieldName].value = coerceScalarFieldValue(
          fieldData ?? normalizeEmDefaultValue(fieldInfo.default_value)
        );
        break;

      case 'RDB':
        break;
    }
  }

  return formData;
}

export function createEmptyFieldValue(fieldInfo: AreaSearchFieldMeta): AreaSearchFormFieldValue {
  const fieldValue: AreaSearchFormFieldValue = { search_type: fieldInfo.search_type };
  const skipDefault = AREA_SEARCH_NO_DEFAULT_FIELDS.has(fieldInfo.field_name);

  switch (fieldInfo.search_type) {
    case 'C':
      fieldValue.value = skipDefault ? undefined : normalizeChoiceFormValue(fieldInfo.default_value);
      break;
    case 'CM':
    case 'CT':
      fieldValue.value = skipDefault ? undefined : resolveChoiceTreeDefaultValue(fieldInfo.default_value);
      break;
    case 'R': {
      const matchOptions =
        fieldInfo.value_type === 'date' ? AREA_SEARCH_DATE_MATCH_OPTIONS : AREA_SEARCH_RANGE_MATCH_OPTIONS;
      const defaultMatch = (fieldInfo.default_value as { match?: string } | undefined)?.match;
      fieldValue.match = defaultMatch ?? matchOptions[AREA_SEARCH_RANGE_DEFAULT_OPTION_INDEX].value;
      fieldValue.value = (fieldInfo.default_value as { value?: unknown } | undefined)?.value;
      break;
    }
    case 'W': {
      const defaultMatch = (fieldInfo.default_value as { match?: string } | undefined)?.match;
      fieldValue.match =
        defaultMatch ?? AREA_SEARCH_WILDCARD_MATCH_OPTIONS[AREA_SEARCH_WILDCARD_DEFAULT_OPTION_INDEX];
      fieldValue.value = coerceScalarFieldValue(
        (fieldInfo.default_value as { value?: unknown } | undefined)?.value
      );
      break;
    }
    case 'EM':
      fieldValue.value = normalizeEmDefaultValue(fieldInfo.default_value);
      break;
    default:
      fieldValue.value = undefined;
  }

  return fieldValue;
}

export function hasValidGeometry(formData: AreaSearchFormData): boolean {
  const geometry = formData.geometry;
  return !!geometry?.match && geometry.value != null && geometry.value !== '';
}

export function removeFormDataField(
  fieldName: string,
  fieldInfo: AreaSearchFieldMeta | undefined,
  formData: AreaSearchFormData
): AreaSearchFormData {
  if (fieldName === 'geometry') {
    delete formData.geometry;
    return formData;
  }

  if (fieldName === 'omit_saved_records') {
    formData.omit_saved_records = { value: false };
    return formData;
  }

  if (fieldName === 'max_limit') {
    formData.max_limit = { check: false, value: formData.max_limit?.value };
    return formData;
  }

  if (!fieldInfo) {
    delete formData[fieldName];
    return formData;
  }

  const fieldValue = formData[fieldName] ?? { search_type: fieldInfo.search_type };

  switch (fieldInfo.search_type) {
    case 'C':
    case 'CM':
    case 'CT':
    case 'CHB':
    case 'RDB':
      fieldValue.value = undefined;
      break;
    case 'R': {
      const matchOptions =
        fieldInfo.value_type === 'date'
          ? AREA_SEARCH_DATE_MATCH_OPTIONS
          : AREA_SEARCH_RANGE_MATCH_OPTIONS;
      const defaultMatch = (fieldInfo.default_value as { match?: string } | undefined)?.match;
      fieldValue.match = defaultMatch ?? matchOptions[AREA_SEARCH_RANGE_DEFAULT_OPTION_INDEX].value;
      fieldValue.value = undefined;
      fieldValue.from = undefined;
      fieldValue.to = undefined;
      break;
    }
    case 'W': {
      const defaultMatch = (fieldInfo.default_value as { match?: string } | undefined)?.match;
      fieldValue.match =
        defaultMatch ?? AREA_SEARCH_WILDCARD_MATCH_OPTIONS[AREA_SEARCH_WILDCARD_DEFAULT_OPTION_INDEX];
      fieldValue.value = undefined;
      break;
    }
    case 'EM':
      fieldValue.value = undefined;
      break;
  }

  formData[fieldName] = fieldValue;
  return formData;
}
