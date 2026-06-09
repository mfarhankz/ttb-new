import { resolveStateAbbrevFromFips } from '../config/us-states.config';
import {
  AreaSearchFieldGroup,
  AreaSearchFieldMeta,
  AreaSearchFieldsInfo,
  AreaSearchFormData,
  AreaSearchPayload
} from '../interfaces/area-search-field.interface';
import { mapFieldChoices } from '@app/shared/components/area-search-fields/area-search-field.utils';
import {
  AREA_SEARCH_CONTACT_FIELD_NAME,
  AREA_SEARCH_CRITERIA_ALWAYS_VISIBLE_FIELDS,
  AREA_SEARCH_CRITERIA_GEOGRAPHIC_ORDER
} from '../config/area-search-fields.config';
import { expandContactInfoValues } from './area-search-contact-note.util';
import { createEmptyFieldValue, flatCustomFilters, parseFormData } from './area-search-form.util';

export interface AreaSearchCriteriaChip {
  fieldName: string;
  label: string;
  displayValue: string;
}

const SKIP_PAYLOAD_KEYS = new Set(['searchOptions', 'customFilters', 'geometry']);
const DYNAMIC_LABEL_FIELDS = new Set(['mm_fips_muni_code', 'sa_site_city', 'sa_site_zip', 'leads_type']);

export type AreaSearchDynamicLabelResolver = (
  fieldName: string,
  value: string,
  dependencyKey: string
) => string | undefined;

function resolveChoiceLabel(
  field: AreaSearchFieldMeta,
  value: string,
  resolveDynamicLabel?: AreaSearchDynamicLabelResolver,
  dependencyKey = 'static'
): string {
  if (field.field_name === 'mm_fips_state_code') {
    return resolveStateAbbrevFromFips(value);
  }

  if (DYNAMIC_LABEL_FIELDS.has(field.field_name) && resolveDynamicLabel) {
    const dynamicLabel = resolveDynamicLabel(field.field_name, value, dependencyKey);
    if (dynamicLabel) {
      return dynamicLabel;
    }
  }

  const options = mapFieldChoices(field);
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatPayloadPrimitive(
  field: AreaSearchFieldMeta,
  payloadValue: unknown,
  resolveDynamicLabel?: AreaSearchDynamicLabelResolver,
  dependencyKey = 'static'
): string | null {
  if (payloadValue == null || payloadValue === '' || payloadValue === '_blank_') {
    return null;
  }

  if (Array.isArray(payloadValue)) {
    if (!payloadValue.length) {
      return null;
    }

    if (field.search_type === 'CT') {
      return payloadValue.map(String).join(',');
    }

    return payloadValue
      .map((value) => resolveChoiceLabel(field, String(value), resolveDynamicLabel, dependencyKey))
      .join(', ');
  }

  if (typeof payloadValue === 'object') {
    return null;
  }

  return resolveChoiceLabel(field, String(payloadValue), resolveDynamicLabel, dependencyKey);
}

function formatPayloadStructured(
  field: AreaSearchFieldMeta,
  payloadValue: unknown,
  resolveDynamicLabel?: AreaSearchDynamicLabelResolver,
  dependencyKey = 'static'
): string | null {
  if (!payloadValue || typeof payloadValue !== 'object' || Array.isArray(payloadValue)) {
    return formatPayloadPrimitive(field, payloadValue, resolveDynamicLabel, dependencyKey);
  }

  const structured = payloadValue as {
    match?: string;
    value?: unknown;
  };

  if (structured.value != null && typeof structured.value === 'object' && !Array.isArray(structured.value)) {
    const range = structured.value as { from?: unknown; to?: unknown };
    if (range.from == null && range.to == null) {
      return null;
    }
    return `${range.from ?? '…'} – ${range.to ?? '…'}`;
  }

  const rawValue = structured.value;
  if (rawValue == null || rawValue === '') {
    return null;
  }

  if (typeof rawValue === 'object') {
    return null;
  }

  const match = structured.match ? `${structured.match} ` : '';
  return `${match}${String(rawValue)}`.trim();
}

function formatPayloadValue(
  field: AreaSearchFieldMeta,
  payloadValue: unknown,
  resolveDynamicLabel?: AreaSearchDynamicLabelResolver,
  dependencyKey = 'static'
): string | null {
  switch (field.search_type) {
    case 'C':
    case 'CM':
    case 'CT':
    case 'CHB':
    case 'RDB':
    case 'EM':
      return formatPayloadPrimitive(field, payloadValue, resolveDynamicLabel, dependencyKey);
    case 'R':
    case 'W':
      return formatPayloadStructured(field, payloadValue, resolveDynamicLabel, dependencyKey);
    default:
      return formatPayloadPrimitive(field, payloadValue, resolveDynamicLabel, dependencyKey);
  }
}

function buildDependencyKeyForField(
  field: AreaSearchFieldMeta,
  formData: AreaSearchFormData,
  resolveDynamicLabel?: AreaSearchDynamicLabelResolver
): string {
  if (!resolveDynamicLabel || !DYNAMIC_LABEL_FIELDS.has(field.field_name)) {
    return 'static';
  }

  switch (field.field_name) {
    case 'mm_fips_muni_code':
      return String(formData['mm_fips_state_code']?.value ?? '');
    case 'sa_site_city':
    case 'sa_site_zip':
    case 'leads_type':
      return `${String(formData['mm_fips_state_code']?.value ?? '')}|${String(formData['mm_fips_muni_code']?.value ?? '')}`;
    default:
      return 'static';
  }
}

function buildDefaultPayload(
  field: AreaSearchFieldMeta,
  fieldGroups: AreaSearchFieldGroup[] | null,
  fieldsInfo: AreaSearchFieldsInfo
): AreaSearchPayload {
  const formData: AreaSearchFormData = {
    [field.field_name]: createEmptyFieldValue(field)
  };
  return flatCustomFilters(parseFormData(formData, fieldGroups, fieldsInfo));
}

function payloadValueMatchesDefault(
  field: AreaSearchFieldMeta,
  payloadValue: unknown,
  fieldGroups: AreaSearchFieldGroup[] | null,
  fieldsInfo: AreaSearchFieldsInfo
): boolean {
  const defaultPayload = buildDefaultPayload(field, fieldGroups, fieldsInfo);

  if (field.search_type === 'RDB') {
    const defaultContact = defaultPayload.searchOptions?.include_contact_info;
    const currentContact = Array.isArray(payloadValue) ? payloadValue : [payloadValue];
    return JSON.stringify(defaultContact ?? null) === JSON.stringify(currentContact);
  }

  const defaultValue = defaultPayload[field.field_name];
  return JSON.stringify(defaultValue ?? null) === JSON.stringify(payloadValue);
}

function collectPayloadCriteria(
  payload: AreaSearchPayload,
  fieldsInfo: AreaSearchFieldsInfo,
  fieldGroups: AreaSearchFieldGroup[] | null,
  formData: AreaSearchFormData,
  resolveDynamicLabel?: AreaSearchDynamicLabelResolver
): AreaSearchCriteriaChip[] {
  const chips: AreaSearchCriteriaChip[] = [];

  for (const [fieldName, payloadValue] of Object.entries(payload)) {
    if (SKIP_PAYLOAD_KEYS.has(fieldName)) {
      continue;
    }

    const field = fieldsInfo[fieldName];
    if (!field) {
      continue;
    }

    if (
      !AREA_SEARCH_CRITERIA_ALWAYS_VISIBLE_FIELDS.has(field.field_name) &&
      payloadValueMatchesDefault(field, payloadValue, fieldGroups, fieldsInfo)
    ) {
      continue;
    }

    const dependencyKey = buildDependencyKeyForField(field, formData, resolveDynamicLabel);
    const displayValue = formatPayloadValue(field, payloadValue, resolveDynamicLabel, dependencyKey);
    if (!displayValue) {
      continue;
    }

    chips.push({
      fieldName,
      label: field.label,
      displayValue
    });
  }

  const contactField = Object.values(fieldsInfo).find(
    (field) => field.field_name === AREA_SEARCH_CONTACT_FIELD_NAME
  );
  const formContactValue = formData[AREA_SEARCH_CONTACT_FIELD_NAME]?.value;
  if (contactField && formContactValue != null && formContactValue !== '') {
    const payloadContact =
      payload.searchOptions?.include_contact_info ??
      expandContactInfoValues(contactField, formContactValue as string | string[]);

    if (payloadContact?.length && !payloadValueMatchesDefault(contactField, payloadContact, fieldGroups, fieldsInfo)) {
      const displayValue = resolveChoiceLabel(contactField, String(formContactValue), resolveDynamicLabel);

      if (displayValue) {
        chips.push({
          fieldName: contactField.field_name,
          label: contactField.label,
          displayValue
        });
      }
    }
  }

  if (payload.geometry && typeof payload.geometry === 'object') {
    const geometryField = fieldsInfo['geometry'];
    if (geometryField) {
      const displayValue = formatPayloadStructured(geometryField, payload.geometry);
      if (displayValue) {
        chips.push({
          fieldName: 'geometry',
          label: geometryField.label ?? 'Geography',
          displayValue
        });
      }
    }
  }

  return sortCriteriaChips(chips, fieldGroups);
}

const GEOGRAPHIC_CRITERIA_RANK = new Map<string, number>(
  AREA_SEARCH_CRITERIA_GEOGRAPHIC_ORDER.map((fieldName, index) => [fieldName, index])
);

function buildFieldOrderIndex(fieldGroups: AreaSearchFieldGroup[] | null): Map<string, number> {
  const order = new Map<string, number>();
  if (!fieldGroups?.length) {
    return order;
  }

  let index = AREA_SEARCH_CRITERIA_GEOGRAPHIC_ORDER.length;
  const sortedGroups = [...fieldGroups].sort(
    (a, b) => (a.group_order ?? a.group_id) - (b.group_order ?? b.group_id)
  );

  for (const group of sortedGroups) {
    for (const field of group.fields ?? []) {
      if (!order.has(field.field_name)) {
        order.set(field.field_name, index++);
      }
    }

    for (const field of group.other_fields ?? []) {
      if (!order.has(field.field_name)) {
        order.set(field.field_name, index++);
      }
    }
  }

  return order;
}

function compareCriteriaChips(
  a: AreaSearchCriteriaChip,
  b: AreaSearchCriteriaChip,
  fieldOrder: Map<string, number>
): number {
  const geoA = GEOGRAPHIC_CRITERIA_RANK.get(a.fieldName);
  const geoB = GEOGRAPHIC_CRITERIA_RANK.get(b.fieldName);

  if (geoA != null && geoB != null) {
    return geoA - geoB;
  }

  if (geoA != null) {
    return -1;
  }

  if (geoB != null) {
    return 1;
  }

  const orderA = fieldOrder.get(a.fieldName) ?? Number.MAX_SAFE_INTEGER;
  const orderB = fieldOrder.get(b.fieldName) ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) {
    return orderA - orderB;
  }

  return a.label.localeCompare(b.label);
}

function sortCriteriaChips(
  chips: AreaSearchCriteriaChip[],
  fieldGroups: AreaSearchFieldGroup[] | null
): AreaSearchCriteriaChip[] {
  const fieldOrder = buildFieldOrderIndex(fieldGroups);
  return [...chips].sort((a, b) => compareCriteriaChips(a, b, fieldOrder));
}

export function buildSelectedCriteria(
  formData: AreaSearchFormData,
  fieldsInfo: AreaSearchFieldsInfo,
  fieldGroups: AreaSearchFieldGroup[] | null = null,
  resolveDynamicLabel?: AreaSearchDynamicLabelResolver
): AreaSearchCriteriaChip[] {
  const payload = flatCustomFilters(parseFormData({ ...formData }, fieldGroups, fieldsInfo));
  return collectPayloadCriteria(payload, fieldsInfo, fieldGroups, formData, resolveDynamicLabel);
}
