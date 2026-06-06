const DEFAULT_USER_TYPE_LABELS: Record<number, string> = {
  1: 'User',
  2: 'Title Rep',
  3: 'Sales Manager',
  4: 'Customer Service',
  5: 'Office Manager',
  6: 'Company Manager',
  7: 'Benutech Support',
  8: 'Benutech Admin'
};

const USER_TYPE_BADGE_TONES: Record<number, string> = {
  1: 'user',
  2: 'info',
  3: 'primary',
  4: 'warning',
  5: 'danger',
  6: 'success',
  7: 'muted',
  8: 'muted'
};

const STATUS_LABELS: Record<string, string> = {
  '1': 'Active',
  '2': 'Disabled',
  '3': 'Pending'
};

export function getUserTypeLabel(
  type: number | string | undefined,
  overrides?: Record<string, string>
): string {
  if (type == null || type === '') {
    return '—';
  }

  const key = String(type);
  return overrides?.[key] ?? DEFAULT_USER_TYPE_LABELS[Number(type)] ?? `Type ${key}`;
}

export function getUserTypeBadgeTone(type: number | string | undefined): string {
  return USER_TYPE_BADGE_TONES[Number(type)] ?? 'default';
}

export interface UserTypeFilterOption {
  value: string;
  label: string;
}

/** Legacy generateAllowedUserTypes — types at or below the logged-in admin's level. */
export function getAllowedUserTypeFilterOptions(
  loggedInUserType: number,
  overrides?: Record<string, string>
): UserTypeFilterOption[] {
  const options: UserTypeFilterOption[] = [{ value: '$', label: 'All User Types' }];

  Object.entries(DEFAULT_USER_TYPE_LABELS).forEach(([typeValue, defaultLabel]) => {
    const type = Number(typeValue);
    if (loggedInUserType > 0 && type >= loggedInUserType) {
      return;
    }

    options.push({
      value: typeValue,
      label: overrides?.[typeValue] ?? defaultLabel
    });
  });

  return options;
}

export function getUserStatusLabel(status: number | string | undefined): string | null {
  if (status == null || status === '') {
    return null;
  }

  const key = String(status);
  if (key !== '2' && key !== '3') {
    return null;
  }

  return STATUS_LABELS[key] ?? key;
}
