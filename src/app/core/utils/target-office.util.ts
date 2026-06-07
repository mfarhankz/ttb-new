export interface TargetOfficeInfo {
  storedByUser?: string | null;
  officeId?: number | string;
  officeTitle?: string;
}

const TARGET_OFFICE_STORAGE_KEYS = ['ngStorage-targetOfficeInfo', 'targetOfficeInfo'] as const;

export function resolveCurrentUsername(
  tbUser?: { username?: string; email?: string } | null
): string | null {
  const direct = tbUser?.username ?? tbUser?.email;
  if (direct) {
    return direct;
  }

  for (const key of ['ngStorage-user', 'user', 'TbUser'] as const) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as {
        TbUser?: { username?: string; email?: string };
        username?: string;
        email?: string;
      };

      const username =
        parsed?.TbUser?.username ??
        parsed?.TbUser?.email ??
        parsed?.username ??
        parsed?.email;

      if (username) {
        return username;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function setTargetOfficeInfo(info: TargetOfficeInfo): void {
  const payload = JSON.stringify(info);

  for (const key of TARGET_OFFICE_STORAGE_KEYS) {
    localStorage.setItem(key, payload);
  }
}

export function readTargetOfficeInfo(options?: {
  currentUsername?: string | null;
  isAgenciesVertical?: boolean;
  requireUserMatch?: boolean;
}): TargetOfficeInfo | null {
  const currentUsername = options?.currentUsername ?? null;
  const isAgenciesVertical = !!options?.isAgenciesVertical;
  const requireUserMatch = options?.requireUserMatch ?? !isAgenciesVertical;

  for (const key of TARGET_OFFICE_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      const parsed = JSON.parse(raw) as TargetOfficeInfo;
      if (parsed?.officeId == null) {
        continue;
      }

      if (requireUserMatch) {
        if (!currentUsername) {
          continue;
        }

        if (parsed.storedByUser != null && parsed.storedByUser !== currentUsername) {
          continue;
        }
      }

      return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

export function getTargetOfficeId(options?: {
  currentUsername?: string | null;
  isAgenciesVertical?: boolean;
  requireUserMatch?: boolean;
}): number | string | null {
  return readTargetOfficeInfo(options)?.officeId ?? null;
}

/** Legacy auth.factory onLoginSuccess + refreshRootScopeUserDepFlags target office bootstrap. */
export function ensureDefaultTargetOffice(options: {
  isOfficeTabAllowed: boolean;
  isVerticalInAgencyMode: boolean;
  currentUsername?: string | null;
  userOfficeId?: number | string | null;
  userOfficeTitle?: string | null;
  agencyOfficeId?: number | string | null;
  agencyOfficeTitle?: string | null;
  isAgenciesVertical?: boolean;
}): TargetOfficeInfo | null {
  const currentUsername = options.currentUsername ?? null;
  const isAgenciesVertical = !!options.isAgenciesVertical;

  if (options.isVerticalInAgencyMode && options.agencyOfficeId != null) {
    const agencyTarget: TargetOfficeInfo = {
      storedByUser: currentUsername,
      officeId: options.agencyOfficeId,
      officeTitle: options.agencyOfficeTitle ?? ''
    };
    setTargetOfficeInfo(agencyTarget);
    return agencyTarget;
  }

  const existing = readTargetOfficeInfo({
    currentUsername,
    isAgenciesVertical,
    requireUserMatch: !isAgenciesVertical
  });

  if (existing) {
    return existing;
  }

  if (!options.isOfficeTabAllowed || options.userOfficeId == null) {
    return null;
  }

  const defaultTarget: TargetOfficeInfo = {
    storedByUser: currentUsername,
    officeId: options.userOfficeId,
    officeTitle: options.userOfficeTitle ?? ''
  };

  setTargetOfficeInfo(defaultTarget);
  return defaultTarget;
}
