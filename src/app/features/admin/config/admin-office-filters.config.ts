export interface OfficeFilterFieldOption {
  value: string;
  label: string;
}

export const OFFICE_FILTER_FIELD_OPTIONS: OfficeFilterFieldOption[] = [
  { value: '$', label: 'All fields' },
  { value: 'name', label: 'Name' },
  { value: 'address', label: 'Address' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'officeInfo', label: 'Office Info' }
];
