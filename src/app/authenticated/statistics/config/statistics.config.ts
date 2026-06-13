export interface TractTypeOption {
  value: string;
  title: string;
}

export const STATS_PROPERTY_TYPE_OPTIONS = [
  { key: 'RSFR', value: 'Single Family Residence' },
  { key: 'RCON', value: 'Condos' },
  { key: 'RNEC', value: 'Residential (NEC)' },
  { key: 'RTWR', value: 'Townhouse/Rowhouse' }
] as const;

export const STATS_TRACT_TYPE_OPTIONS: TractTypeOption[] = [
  { value: 'city', title: 'City' },
  { value: 'zip', title: 'Zip Code' },
  { value: 'carrier_route', title: 'Carrier Route' },
  { value: 'census_tract', title: 'Census Tract' },
  { value: 'property_tract', title: 'Property Tract' },
  { value: 'zip_plus_4', title: 'Zip Plus 4' },
  { value: 'tax_rate_area', title: 'Tax Rate Area' }
];

export const STATS_RANGE_FIELDS = [
  { name: 'total_units', label: '# of Homes' },
  { name: 'avg_price', label: 'Average Sales Price ($)' },
  { name: 'turnover_rate', label: 'Turn Over Rates (%)' },
  { name: 'NOO_ratio', label: 'Non Owner Ratios (%)' },
  { name: 'avg_yr_owned', label: 'Average Years Owned' }
] as const;
