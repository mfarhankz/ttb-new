import { buildSelectedCriteria } from './area-search-criteria.util';
import { AREA_SEARCH_CONTACT_FIELD_NAME } from '@app/features/farming/config/area-search-fields.config';
import { AreaSearchFieldGroup, AreaSearchFieldsInfo, AreaSearchFormData } from '../interfaces/area-search-field.interface';

describe('area-search-criteria.util', () => {
  const fieldsInfo: AreaSearchFieldsInfo = {
    mm_fips_state_code: {
      field_name: 'mm_fips_state_code',
      label: 'State',
      search_type: 'C',
      group_id: 1,
      default_value: '06'
    },
    mm_fips_muni_code: {
      field_name: 'mm_fips_muni_code',
      label: 'County',
      search_type: 'CM',
      group_id: 1
    },
    sa_site_city: {
      field_name: 'sa_site_city',
      label: 'Site City',
      search_type: 'CM',
      group_id: 1
    },
    sa_site_zip: {
      field_name: 'sa_site_zip',
      label: 'Site Zip Code',
      search_type: 'CM',
      group_id: 1
    },
    sa_mail_city: {
      field_name: 'sa_mail_city',
      label: 'Mailing City',
      search_type: 'W',
      group_id: 1
    },
    use_code_std: {
      field_name: 'use_code_std',
      label: 'Property Type',
      search_type: 'CT',
      group_id: 2,
      default_value: ['RSFR', 'RCON']
    }
  };

  const fieldGroups: AreaSearchFieldGroup[] = [
    {
      group_id: 1,
      group_name: 'General',
      fields: [
        fieldsInfo.mm_fips_state_code,
        fieldsInfo.mm_fips_muni_code,
        fieldsInfo.sa_site_city,
        fieldsInfo.sa_site_zip
      ],
      other_fields: [fieldsInfo.sa_mail_city]
    },
    {
      group_id: 2,
      group_name: 'Property Characteristics',
      fields: [fieldsInfo.use_code_std]
    }
  ];

  it('shows geometry criteria chip with radius label', () => {
    const formData: AreaSearchFormData = {
      omit_saved_records: { value: false },
      max_limit: { check: false },
      geometry: {
        search_type: 'geometry',
        match: 'circle',
        value: {
          center_lng: '-117.84',
          center_lat: '33.68',
          radius: '2.5'
        }
      }
    };

    const chips = buildSelectedCriteria(formData, fieldsInfo, fieldGroups);
    const geometryChip = chips.find((chip) => chip.fieldName === 'geometry');

    expect(geometryChip).toEqual({
      fieldName: 'geometry',
      label: 'Geometry Type',
      displayValue: 'Radius',
      viewable: true
    });
  });

  it('shows only user-selected searchable values', () => {
    const formData: AreaSearchFormData = {
      omit_saved_records: { value: false },
      max_limit: { check: false },
      mm_fips_state_code: { search_type: 'C', value: '01' },
      mm_fips_muni_code: { search_type: 'CM', value: ['001'] },
      sa_site_city: { search_type: 'CM', value: ['AUTAUGAVILLE'] },
      sa_site_zip: { search_type: 'CM', value: ['36003', '36006'] },
      sa_mail_city: { search_type: 'W', match: 'Contains', value: {} }
    };

    const chips = buildSelectedCriteria(formData, fieldsInfo, fieldGroups);
    const labels = chips.map((chip) => chip.label);

    expect(labels).toEqual(['State', 'County', 'Site City', 'Site Zip Code']);
    expect(chips.find((chip) => chip.label === 'Mailing City')).toBeUndefined();
    expect(chips.some((chip) => chip.displayValue.includes('[object Object]'))).toBe(false);
  });

  it('shows the selected contact option label in criteria chips', () => {
    const contactField = {
      field_name: AREA_SEARCH_CONTACT_FIELD_NAME,
      label: 'Include Contact',
      search_type: 'RDB' as const,
      group_id: 8,
      choices: {
        $: 'Both Phones and Emails',
        PH: 'Purchase Phones',
        EM: 'Purchase Emails'
      }
    };

    const contactFieldsInfo: AreaSearchFieldsInfo = {
      ...fieldsInfo,
      [AREA_SEARCH_CONTACT_FIELD_NAME]: contactField
    };

    const contactFieldGroups: AreaSearchFieldGroup[] = [
      ...fieldGroups,
      {
        group_id: 8,
        group_name: 'Phones And Emails',
        layout_row: false,
        fields: [contactField]
      }
    ];

    const formData: AreaSearchFormData = {
      [AREA_SEARCH_CONTACT_FIELD_NAME]: { search_type: 'RDB', value: '$' }
    };

    const chips = buildSelectedCriteria(formData, contactFieldsInfo, contactFieldGroups);
    const contactChip = chips.find((chip) => chip.fieldName === AREA_SEARCH_CONTACT_FIELD_NAME);

    expect(contactChip?.displayValue).toBe('Both Phones and Emails');
  });

  it('shows state when only the default value is present', () => {
    const formData: AreaSearchFormData = {
      mm_fips_state_code: { search_type: 'C', value: '06' }
    };

    const chips = buildSelectedCriteria(formData, fieldsInfo, fieldGroups);
    const stateChip = chips.find((chip) => chip.label === 'State');

    expect(stateChip?.displayValue).toBe('CA');
  });

  it('orders geographic chips before other fields in form tab order', () => {
    const formData: AreaSearchFormData = {
      mm_fips_state_code: { search_type: 'C', value: '06' },
      mm_fips_muni_code: { search_type: 'CM', value: ['001'] },
      sa_site_city: { search_type: 'CM', value: ['ALAMEDA'] },
      sa_site_zip: { search_type: 'CM', value: ['94501'] },
      use_code_std: { search_type: 'CT', value: ['RSFR', 'RCON', 'RTRW', 'RNEC'] }
    };

    const chips = buildSelectedCriteria(formData, fieldsInfo, fieldGroups);

    expect(chips.map((chip) => chip.label)).toEqual([
      'State',
      'County',
      'Site City',
      'Site Zip Code',
      'Property Type'
    ]);
  });

  it('shows property type codes when only the default value is present', () => {
    const formData: AreaSearchFormData = {
      use_code_std: { search_type: 'CT', value: ['RSFR', 'RCON'] }
    };

    const chips = buildSelectedCriteria(formData, fieldsInfo, fieldGroups);
    const propertyTypeChip = chips.find((chip) => chip.label === 'Property Type');

    expect(propertyTypeChip?.displayValue).toBe('RSFR,RCON');
  });
});
