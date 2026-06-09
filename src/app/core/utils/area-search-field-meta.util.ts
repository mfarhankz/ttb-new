import { AreaSearchFieldMeta } from '../interfaces/area-search-field.interface';

/** Reject empty objects and other non-scalar values used as text/number field values. */
export function coerceScalarFieldValue(value: unknown): string | number | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'object') {
    return undefined;
  }

  const text = String(value).trim();
  return text === '' ? undefined : text;
}

/** Safe string for text input bindings — never surfaces "[object Object]". */
export function coerceTextInputValue(value: unknown): string {
  const scalar = coerceScalarFieldValue(value);
  return scalar == null ? '' : String(scalar);
}

/** Legacy dynamicExactMatch.fixDefaultValue — normalize EM default_value shape. */
export function normalizeEmDefaultValue(defaultValue: unknown): string | number | undefined {
  if (defaultValue == null) {
    return undefined;
  }

  if (typeof defaultValue === 'object') {
    if ('value' in (defaultValue as object)) {
      return coerceScalarFieldValue((defaultValue as { value?: unknown }).value);
    }

    return undefined;
  }

  return coerceScalarFieldValue(defaultValue);
}

export function normalizeExactMatchFieldMeta(field: AreaSearchFieldMeta): void {
  if (field.search_type !== 'EM') {
    return;
  }

  field.default_value = { value: normalizeEmDefaultValue(field.default_value) };
}

/** Unselected choice fields use undefined — not the legacy "_blank_" sentinel. */
export function normalizeChoiceFormValue(value: unknown): string | undefined {
  if (value == null || value === '' || value === '_blank_') {
    return undefined;
  }

  return String(value);
}

/** Legacy CT/CM fields store defaults as `{ value: string[] }` or a plain array. */
export function resolveChoiceTreeDefaultValue(defaultValue: unknown): string[] | undefined {
  if (defaultValue == null) {
    return undefined;
  }

  const raw =
    typeof defaultValue === 'object' && !Array.isArray(defaultValue) && 'value' in (defaultValue as object)
      ? (defaultValue as { value?: unknown }).value
      : defaultValue;

  if (!Array.isArray(raw) || !raw.length) {
    return undefined;
  }

  return raw.map(String);
}

export function normalizeChoiceTreeFieldMeta(field: AreaSearchFieldMeta): void {
  if (field.search_type !== 'CT' && field.search_type !== 'CM') {
    return;
  }

  const defaults = resolveChoiceTreeDefaultValue(field.default_value);
  if (defaults) {
    field.default_value = defaults;
  }
}

export function normalizeFieldValidation(field: AreaSearchFieldMeta): void {
  const validation = field.validation as unknown;

  if (validation == null || validation === '') {
    field.validation = {};
    return;
  }

  if (typeof validation !== 'object') {
    field.validation = {};
  }
}

export function resolveExactMatchInputType(field: AreaSearchFieldMeta): string {
  const valueType = (field.value_type ?? 'text').toLowerCase();
  if (valueType === 'number') {
    return 'number';
  }

  if (valueType === 'date') {
    return 'date';
  }

  return 'text';
}

export function resolveRangeInputType(field: AreaSearchFieldMeta): 'number' | 'date' | 'text' {
  const valueType = (field.value_type ?? '').toLowerCase();
  if (valueType === 'date') {
    return 'date';
  }

  if (valueType === 'number') {
    return 'number';
  }

  return 'text';
}

export function resolveTextMaxLength(validation?: Record<string, unknown>): number | null {
  if (!validation) {
    return null;
  }

  const maxLength = validation['maxlength'] ?? validation['max'];
  if (maxLength == null || maxLength === '') {
    return null;
  }

  const parsed = Number(maxLength);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatExactMatchDateValue(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const raw = String(value);
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.substring(0, 10) : raw;
}

export function fieldHasBlankChoice(field: AreaSearchFieldMeta): boolean {
  if (!field.choices || Array.isArray(field.choices)) {
    return field.default_value === '_blank_';
  }

  return '_blank_' in field.choices || field.default_value === '_blank_';
}

export function normalizeChoiceFieldMeta(field: AreaSearchFieldMeta): void {
  if (field.search_type !== 'C' || !fieldHasBlankChoice(field)) {
    return;
  }

  field.default_value = normalizeChoiceFormValue(field.default_value);
}
