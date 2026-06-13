import { TestBed } from '@angular/core/testing';
import { AreaSearchDynamicChoicesService } from '@app/authenticated/farming/services/area-search-dynamic-choices.service';
import { AreaSearchFieldMeta, AreaSearchFormData } from '@app/core/interfaces/area-search-field.interface';
import { ApiService } from '@app/core/services/api.service';

describe('AreaSearchDynamicChoicesService geographic chain', () => {
  let service: AreaSearchDynamicChoicesService;

  const cityField: AreaSearchFieldMeta = {
    field_name: 'sa_site_city',
    label: 'Site City',
    search_type: 'CM',
    choices_source: { api_input: 'mm_fips_state_code' }
  } as AreaSearchFieldMeta;

  const stateOnlyForm: AreaSearchFormData = {
    mm_fips_state_code: { search_type: 'C', value: '06' },
    mm_fips_muni_code: { search_type: 'CM', value: undefined }
  };

  const stateAndCountyForm: AreaSearchFormData = {
    mm_fips_state_code: { search_type: 'C', value: '06' },
    mm_fips_muni_code: { search_type: 'CM', value: ['001'] }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AreaSearchDynamicChoicesService,
        { provide: ApiService, useValue: { getParsedJson: () => ({ pipe: () => ({}) }) } }
      ]
    });

    service = TestBed.inject(AreaSearchDynamicChoicesService);
  });

  it('disables city and zip until county is selected', () => {
    expect(service.isGeographicFieldDisabled('sa_site_city', stateOnlyForm)).toBe(true);
    expect(service.isGeographicFieldDisabled('sa_site_zip', stateOnlyForm)).toBe(true);
    expect(service.isGeographicFieldDisabled('sa_site_city', stateAndCountyForm)).toBe(false);
  });

  it('treats empty county arrays and blank sentinels as unselected', () => {
    const emptyCountyForm: AreaSearchFormData = {
      mm_fips_state_code: { search_type: 'C', value: '06' },
      mm_fips_muni_code: { search_type: 'CM', value: [] }
    };
    const blankCountyForm: AreaSearchFormData = {
      mm_fips_state_code: { search_type: 'C', value: '06' },
      mm_fips_muni_code: { search_type: 'CM', value: [''] }
    };

    expect(service.isGeographicFieldDisabled('sa_site_city', emptyCountyForm)).toBe(true);
    expect(service.isGeographicFieldDisabled('sa_site_city', blankCountyForm)).toBe(true);
  });

  it('requires county in api input even when metadata only lists state', () => {
    expect(service.getApiInput(cityField)).toBe('mm_fips_state_code+mm_fips_muni_code');
    expect(service.hasRequiredInputs(cityField, stateOnlyForm)).toBe(false);
    expect(service.hasRequiredInputs(cityField, stateAndCountyForm)).toBe(true);
  });

  it('does not fetch city choices without county', (done) => {
    service.fetchChoices({ field: cityField, formData: stateOnlyForm }).subscribe((options) => {
      expect(options).toEqual([]);
      done();
    });
  });
});
