import { AddressSearchFormData } from '../interfaces/property-search.interface';

export function normalizeCountyForDropdown(county?: string): string | undefined {
  if (!county) {
    return county;
  }

  return county.replace(/ County$/i, '').toUpperCase();
}

export function buildFullSiteAddressFromPlace(
  details: AddressSearchFormData & { site_unit?: string },
  includeUnit = false
): string {
  const streetParts = [details.site_street_number, details.site_route].filter(Boolean).join(' ').trim();
  const unitPart = includeUnit && details.site_unit ? `Apt ${details.site_unit}` : '';
  const cityStateZip = [details.site_city, details.site_state, details.site_zip]
    .map((part) => (part != null ? String(part).trim() : ''))
    .filter(Boolean)
    .join(', ');

  return [streetParts, unitPart, cityStateZip, 'USA']
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}

export function extractUnitFromAddressQuery(addressQuery: string): string | undefined {
  const match = addressQuery.match(/(#|unit|apt)\s?([0-9a-z\-]+)/i);
  return match?.[2];
}
