import { AREA_SEARCH_TAB_ICONS } from '@app/core/config/area-search-fields.config';
import { AreaSearchFieldMeta } from '@app/core/interfaces/area-search-field.interface';

export interface AreaSearchChoiceOption {
  label: string;
  value: string;
}

export interface AreaSearchFieldLabelParts {
  primary: string;
  secondary?: string;
}

/** Split "Title ( extra detail )" so parenthetical text can use smaller typography. */
export function splitFieldLabel(label: string): AreaSearchFieldLabelParts {
  const index = label.indexOf('(');
  if (index === -1) {
    return { primary: label };
  }

  return {
    primary: label.slice(0, index).trimEnd(),
    secondary: label.slice(index).trim()
  };
}

export function mapFieldChoices(field: AreaSearchFieldMeta): AreaSearchChoiceOption[] {
  if (!field.choices) {
    return [];
  }

  if (Array.isArray(field.choices)) {
    return field.choices.map((choice) => ({
      label: String(choice.label ?? choice.value ?? ''),
      value: String(choice.value ?? choice.label ?? '')
    }));
  }

  return Object.entries(field.choices).map(([value, label]) => ({
    label: String(label),
    value
  }));
}

export interface AreaSearchTreeOptionGroup {
  label: string;
  value: string;
  items: AreaSearchChoiceOption[];
}

export function mapTreeChoiceGroups(
  field: AreaSearchFieldMeta,
  maxPerGroup = 500
): AreaSearchTreeOptionGroup[] {
  const grouped = mapTreeChoices(field);

  return Object.entries(grouped).map(([key, options], index) => ({
    label: key,
    value: `group-${index}-${key.replace(/\s+/g, '_').toLowerCase()}`,
    items: options.slice(0, maxPerGroup)
  }));
}

export function mapTreeChoices(field: AreaSearchFieldMeta): Record<string, AreaSearchChoiceOption[]> {
  if (!field.choices || Array.isArray(field.choices)) {
    return {};
  }

  const grouped: Record<string, AreaSearchChoiceOption[]> = {};
  for (const [groupName, choices] of Object.entries(field.choices)) {
    if (choices && typeof choices === 'object' && !Array.isArray(choices)) {
      grouped[groupName] = Object.entries(choices as Record<string, string>).map(([value, label]) => ({
        label: String(label),
        value
      }));
    }
  }

  return grouped;
}

export {
  formatExactMatchDateValue,
  normalizeEmDefaultValue,
  resolveExactMatchInputType
} from '@app/core/utils/area-search-field-meta.util';

export function tabIconClass(groupName: string): string {
  const key = (groupName || '').split(' ')[0]?.toLowerCase() ?? 'basic';
  return AREA_SEARCH_TAB_ICONS[key] ?? 'pi pi-sliders-h';
}
