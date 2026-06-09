import { createEmptyFieldValue, parseFormData, payloadToFormData } from './area-search-form.util';
import { normalizeExactMatchFieldMeta } from './area-search-field-meta.util';
import {
  AreaSearchFieldGroup,
  AreaSearchFieldMeta,
  AreaSearchFieldsInfo,
  AreaSearchFormData
} from '../interfaces/area-search-field.interface';

describe('area-search-form.util', () => {
  const fieldsInfo: AreaSearchFieldsInfo = {
    mm_fips_state_code: {
      field_name: 'mm_fips_state_code',
      label: 'State',
      search_type: 'C',
      group_id: 1
    },
    sa_city: {
      field_name: 'sa_city',
      label: 'City',
      search_type: 'W',
      group_id: 1,
      value_type: 'string'
    },
    include_contact_info: {
      field_name: 'include_contact_info',
      label: 'Include Contact',
      search_type: 'RDB',
      group_id: 8,
      choices: {
        $: 'Both',
        PH: 'Phones',
        EM: 'Emails'
      }
    }
  };

  const fieldGroups: AreaSearchFieldGroup[] = [
    {
      group_id: 6,
      group_name: 'Custom Filters',
      fields: [
        {
          field_name: 'custom_filter_1',
          label: 'Custom Filter',
          search_type: 'C',
          group_id: 6
        }
      ]
    }
  ];

  it('parses choice and wildcard fields into payload', () => {
    const formData: AreaSearchFormData = {
      omit_saved_records: { value: true },
      max_limit: { check: true, value: 500 },
      mm_fips_state_code: { search_type: 'C', value: 'CA' },
      sa_city: { search_type: 'W', match: 'Contains', value: 'Irvine' }
    };

    const payload = parseFormData(formData, fieldGroups, fieldsInfo);

    expect(payload.searchOptions?.omit_saved_records).toBe(true);
    expect(payload.searchOptions?.max_limit).toBe(500);
    expect(payload['mm_fips_state_code']).toBe('CA');
    expect(payload['sa_city']).toEqual({ match: 'Contains', value: 'Irvine' });
  });

  it('round-trips payload back into form data', () => {
    const payload = {
      searchOptions: {
        omit_saved_records: true,
        max_limit: 250,
        include_contact_info: ['PH']
      },
      mm_fips_state_code: 'CA',
      sa_city: { match: 'Starts/w', value: 'San' }
    };

    const formData = payloadToFormData(payload, {}, fieldsInfo);

    expect(formData.omit_saved_records?.value).toBe(true);
    expect(formData.max_limit?.check).toBe(true);
    expect(formData.max_limit?.value).toBe(250);
    expect(formData['include_contact_info']?.value).toBe('PH');
    expect(formData['mm_fips_state_code']?.value).toBe('CA');
    expect(formData['sa_city']?.match).toBe('Starts/w');
    expect(formData['sa_city']?.value).toBe('San');
  });

  it('does not initialize EM/W fields with empty object values', () => {
    const mailRoute: AreaSearchFieldMeta = {
      field_name: 'sa_mail_carrier_route',
      label: 'Mailing Carrier Route',
      search_type: 'EM',
      group_id: 5,
      default_value: {}
    };

    normalizeExactMatchFieldMeta(mailRoute);

    expect(createEmptyFieldValue(mailRoute).value).toBeUndefined();
    expect(
      payloadToFormData({}, {}, { sa_mail_carrier_route: mailRoute })['sa_mail_carrier_route']?.value
    ).toBeUndefined();
  });

  it('initializes choice tree fields from wrapped default_value objects', () => {
    const propertyType: AreaSearchFieldMeta = {
      field_name: 'use_code_std',
      label: 'Property Type',
      search_type: 'CT',
      group_id: 2,
      default_value: { value: ['RSFR', 'RCON', 'RTRW', 'RNEC'] }
    };

    expect(createEmptyFieldValue(propertyType).value).toEqual(['RSFR', 'RCON', 'RTRW', 'RNEC']);
  });

  it('does not preselect Filter Off for blank choice fields', () => {
    const customFilter: AreaSearchFieldMeta = {
      field_name: 'custom_non_owner',
      label: 'NonOwner',
      search_type: 'C',
      group_id: 6,
      default_value: '_blank_',
      choices: {
        _blank_: 'Filter Off',
        Y: 'Yes',
        N: 'No'
      }
    };

    expect(createEmptyFieldValue(customFilter).value).toBeUndefined();
    expect(
      payloadToFormData({ custom_non_owner: '_blank_' }, {}, { custom_non_owner: customFilter })
        .custom_non_owner?.value
    ).toBeUndefined();
  });
});
