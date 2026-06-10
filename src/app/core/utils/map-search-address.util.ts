import { SmartyAddressDetails } from '../interfaces/smarty.interface';

export function formatSearchAddressMarkup(details: SmartyAddressDetails): string {
  const streetLine = [details.site_street_number, details.site_route].filter(Boolean).join(', ');

  const locationParts = [
    details.site_city,
    details.county,
    details.site_state,
    details.site_zip,
    details.country || 'United States'
  ].filter(Boolean);

  const locationLine = locationParts.join(', ');

  return [
    '<div class="info-box">',
    `<p class="search-title">${streetLine}</p>`,
    `<p class="search-para">${locationLine}</p>`,
    '</div>'
  ].join('');
}
