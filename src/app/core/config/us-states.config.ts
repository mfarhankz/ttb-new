import { SelectOption } from '@app/shared/ui/select/select.component';

/** US states for profile address dropdown (matches legacy state choices). */
export const US_STATE_OPTIONS: SelectOption[] = [
  { label: 'Alabama', value: 'AL' },
  { label: 'Alaska', value: 'AK' },
  { label: 'Arizona', value: 'AZ' },
  { label: 'Arkansas', value: 'AR' },
  { label: 'California', value: 'CA' },
  { label: 'Colorado', value: 'CO' },
  { label: 'Connecticut', value: 'CT' },
  { label: 'Delaware', value: 'DE' },
  { label: 'District of Columbia', value: 'DC' },
  { label: 'Florida', value: 'FL' },
  { label: 'Georgia', value: 'GA' },
  { label: 'Hawaii', value: 'HI' },
  { label: 'Idaho', value: 'ID' },
  { label: 'Illinois', value: 'IL' },
  { label: 'Indiana', value: 'IN' },
  { label: 'Iowa', value: 'IA' },
  { label: 'Kansas', value: 'KS' },
  { label: 'Kentucky', value: 'KY' },
  { label: 'Louisiana', value: 'LA' },
  { label: 'Maine', value: 'ME' },
  { label: 'Maryland', value: 'MD' },
  { label: 'Massachusetts', value: 'MA' },
  { label: 'Michigan', value: 'MI' },
  { label: 'Minnesota', value: 'MN' },
  { label: 'Mississippi', value: 'MS' },
  { label: 'Missouri', value: 'MO' },
  { label: 'Montana', value: 'MT' },
  { label: 'Nebraska', value: 'NE' },
  { label: 'Nevada', value: 'NV' },
  { label: 'New Hampshire', value: 'NH' },
  { label: 'New Jersey', value: 'NJ' },
  { label: 'New Mexico', value: 'NM' },
  { label: 'New York', value: 'NY' },
  { label: 'North Carolina', value: 'NC' },
  { label: 'North Dakota', value: 'ND' },
  { label: 'Ohio', value: 'OH' },
  { label: 'Oklahoma', value: 'OK' },
  { label: 'Oregon', value: 'OR' },
  { label: 'Pennsylvania', value: 'PA' },
  { label: 'Rhode Island', value: 'RI' },
  { label: 'South Carolina', value: 'SC' },
  { label: 'South Dakota', value: 'SD' },
  { label: 'Tennessee', value: 'TN' },
  { label: 'Texas', value: 'TX' },
  { label: 'Utah', value: 'UT' },
  { label: 'Vermont', value: 'VT' },
  { label: 'Virginia', value: 'VA' },
  { label: 'Washington', value: 'WA' },
  { label: 'West Virginia', value: 'WV' },
  { label: 'Wisconsin', value: 'WI' },
  { label: 'Wyoming', value: 'WY' }
];

/** Legacy areaChoicesFactory.staticStatesListRaw — FIPS code by state abbrev. */
export const US_STATE_FIPS_BY_ABBREV: Record<string, string> = {
  AK: '02',
  AL: '01',
  AR: '05',
  AZ: '04',
  CA: '06',
  CO: '08',
  CT: '09',
  DC: '11',
  DE: '10',
  FL: '12',
  GA: '13',
  HI: '15',
  IA: '19',
  ID: '16',
  IL: '17',
  IN: '18',
  KS: '20',
  KY: '21',
  LA: '22',
  MA: '25',
  MD: '24',
  ME: '23',
  MI: '26',
  MN: '27',
  MO: '29',
  MS: '28',
  MT: '30',
  NC: '37',
  ND: '38',
  NE: '31',
  NH: '33',
  NJ: '34',
  NM: '35',
  NV: '32',
  NY: '36',
  OH: '39',
  OK: '40',
  OR: '41',
  PA: '42',
  RI: '44',
  SC: '45',
  SD: '46',
  TN: '47',
  TX: '48',
  UT: '49',
  VA: '51',
  VT: '50',
  WA: '53',
  WI: '55',
  WV: '54',
  WY: '56'
};

type StateOptionLabelKey = 'name' | 'abbrev';
type StateOptionValueKey = 'abbrev' | 'fips';

function buildStateOptions(
  labelKey: StateOptionLabelKey,
  valueKey: StateOptionValueKey
): { label: string; value: string }[] {
  return US_STATE_OPTIONS.map((state) => ({
    label: labelKey === 'name' ? state.label : String(state.value),
    value: valueKey === 'abbrev' ? String(state.value) : (US_STATE_FIPS_BY_ABBREV[String(state.value)] ?? '')
  }))
    .filter((option) => option.value)
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Legacy property search — state abbreviations sorted A–Z (AK, AL, AR…). */
export const US_STATE_ABBREV_OPTIONS: SelectOption[] = buildStateOptions('abbrev', 'abbrev');

/** Legacy get_states — FIPS value with full state name label. */
export const US_STATE_FIPS_OPTIONS: { label: string; value: string }[] = buildStateOptions('name', 'fips');

/** Legacy area search state dropdown — abbrev label (AK, AL…), FIPS value, sorted A–Z. */
export const US_STATE_AREA_SEARCH_OPTIONS: { label: string; value: string }[] = buildStateOptions(
  'abbrev',
  'fips'
);

const US_STATE_FIPS_TO_ABBREV = new Map(
  US_STATE_AREA_SEARCH_OPTIONS.map((option) => [option.value, option.label])
);

export function resolveStateAbbrevFromFips(fips: string): string {
  return US_STATE_FIPS_TO_ABBREV.get(fips) ?? fips;
}
