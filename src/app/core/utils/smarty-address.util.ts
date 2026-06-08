import {
  SmartyAutocompleteSuggestion,
  SmartyUSAddressResponse
} from '../interfaces/smarty.interface';

const DIRECTIONALS: Record<string, boolean> = {
  N: true,
  S: true,
  E: true,
  W: true,
  NE: true,
  NW: true,
  SE: true,
  SW: true
};

const STREET_SUFFIXES: Record<string, boolean> = {
  ST: true,
  STREET: true,
  AVE: true,
  AVENUE: true,
  RD: true,
  ROAD: true,
  BLVD: true,
  BOULEVARD: true,
  DR: true,
  DRIVE: true,
  LN: true,
  LANE: true,
  CT: true,
  COURT: true,
  CIR: true,
  CIRCLE: true,
  PKWY: true,
  PARKWAY: true,
  WAY: true,
  TER: true,
  TERRACE: true,
  PL: true,
  PLACE: true,
  LOOP: true,
  HWY: true,
  HIGHWAY: true
};

export function toSmartyUSAddressResponse(
  suggestion: SmartyAutocompleteSuggestion | null | undefined
): SmartyUSAddressResponse {
  const response: SmartyUSAddressResponse = {
    delivery_line_1: '',
    last_line: '',
    delivery_point_barcode: '',
    components: {
      primary_number: '',
      street_predirection: '',
      street_name: '',
      street_suffix: '',
      street_postdirection: '',
      secondary_number: '',
      secondary_designator: '',
      city_name: '',
      default_city_name: '',
      state_abbreviation: '',
      zipcode: '',
      plus4_code: ''
    },
    metadata: {}
  };

  if (!suggestion) {
    return response;
  }

  response.delivery_line_1 = suggestion.street_line;
  if (suggestion.secondary) {
    response.delivery_line_1 += ` ${suggestion.secondary}`;
  }

  response.last_line = `${suggestion.city} ${suggestion.state} ${suggestion.zipcode}`;
  response.components.city_name = suggestion.city || '';
  response.components.default_city_name = suggestion.city || '';
  response.components.state_abbreviation = suggestion.state || '';
  response.components.zipcode = suggestion.zipcode || '';

  const tokens = (suggestion.street_line || '').split(/\s+/);

  if (tokens.length && /^\d+[A-Z\-]*$/i.test(tokens[0])) {
    response.components.primary_number = tokens.shift() ?? '';
  }

  if (tokens.length) {
    const first = tokens[0].toUpperCase();
    if (DIRECTIONALS[first]) {
      response.components.street_predirection = tokens.shift()?.toUpperCase() ?? '';
    }
  }

  if (tokens.length) {
    const last = tokens[tokens.length - 1].toUpperCase();
    if (STREET_SUFFIXES[last]) {
      response.components.street_suffix = tokens.pop() ?? '';
    }
  }

  response.components.street_name = tokens.join(' ');

  if (suggestion.secondary) {
    const secondaryMatch = suggestion.secondary.match(/^([A-Za-z# ]+?)\s*([A-Za-z0-9-]+)$/);
    if (secondaryMatch) {
      response.components.secondary_designator = secondaryMatch[1]?.trim() ?? '';
      response.components.secondary_number = secondaryMatch[2]?.trim() ?? '';
    }
  }

  return response;
}

export function buildSmartyFullAddress(suggestion: SmartyAutocompleteSuggestion): string {
  let secondary = ',';
  if (suggestion.secondary) {
    secondary = ` ${suggestion.secondary}`;
    secondary += suggestion.entries > 1 ? '..' : ',';
  }

  return `${suggestion.street_line}${secondary} ${suggestion.city}, ${suggestion.state} ${suggestion.zipcode}`;
}

export function buildSmartySelectionAddress(suggestion: SmartyAutocompleteSuggestion): string {
  const fullAddress = buildSmartyFullAddress(suggestion);
  return fullAddress.replace('..', ` (${suggestion.entries})`).replace(/,/g, '');
}
