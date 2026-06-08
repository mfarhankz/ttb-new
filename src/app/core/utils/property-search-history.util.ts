import {
  AddressSearchHistoryEntry,
  PROPERTY_SEARCH_HISTORY_KEY
} from '../interfaces/property-search.interface';

const MAX_HISTORY_ENTRIES = 10;

function dedupeKey(entry: AddressSearchHistoryEntry): string {
  return [
    entry.site_street_number ?? '',
    entry.site_route ?? '',
    entry.site_city ?? '',
    entry.site_state ?? '',
    entry.site_zip ?? ''
  ].join('|');
}

export function loadAddressSearchHistory(): AddressSearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(PROPERTY_SEARCH_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as AddressSearchHistoryEntry[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return dedupeAddressSearchHistory(parsed);
  } catch {
    return [];
  }
}

export function saveAddressSearchHistory(entry: AddressSearchHistoryEntry): void {
  const history = loadAddressSearchHistory();
  const next = dedupeAddressSearchHistory([...history, entry]);
  localStorage.setItem(PROPERTY_SEARCH_HISTORY_KEY, JSON.stringify(next.slice(-MAX_HISTORY_ENTRIES)));
}

function dedupeAddressSearchHistory(entries: AddressSearchHistoryEntry[]): AddressSearchHistoryEntry[] {
  const seen = new Set<string>();
  const result: AddressSearchHistoryEntry[] = [];

  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    const key = dedupeKey(entry);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.unshift(entry);
  }

  return result.slice(-MAX_HISTORY_ENTRIES);
}

export function formatHistoryAddress(entry: AddressSearchHistoryEntry): string {
  const parts = [
    entry.site_street_number,
    entry.site_route,
    entry.site_city,
    entry.site_state,
    entry.site_zip
  ]
    .map((part) => (part != null ? String(part).trim() : ''))
    .filter(Boolean);

  return parts.length ? parts.join(', ') : '—';
}
