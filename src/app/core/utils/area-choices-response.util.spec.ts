import { extractChoicesRecord } from './area-choices-response.util';

describe('extractChoicesRecord', () => {
  it('parses plain county map responses', () => {
    expect(extractChoicesRecord({ '001': 'ALAMEDA', '013': 'CONTRA COSTA' })).toEqual({
      '001': 'ALAMEDA',
      '013': 'CONTRA COSTA'
    });
  });

  it('parses envelope responses', () => {
    expect(
      extractChoicesRecord({
        response: { status: 'OK', data: { '037': 'LOS ANGELES' } }
      })
    ).toEqual({ '037': 'LOS ANGELES' });
  });

  it('parses root data when includeDataRoot is true', () => {
    expect(
      extractChoicesRecord({ data: { '059': 'ORANGE' } }, { includeDataRoot: true })
    ).toEqual({ '059': 'ORANGE' });
  });

  it('ignores root data when includeDataRoot is false', () => {
    expect(extractChoicesRecord({ data: { '059': 'ORANGE' } })).toBeNull();
  });

  it('parses string array responses', () => {
    expect(extractChoicesRecord(['90210', '90211'])).toEqual({
      '90210': '90210',
      '90211': '90211'
    });
  });

  it('returns null for empty or invalid payloads', () => {
    expect(extractChoicesRecord(null)).toBeNull();
    expect(extractChoicesRecord([])).toBeNull();
    expect(extractChoicesRecord({ response: { status: 'OK' } })).toBeNull();
  });
});
