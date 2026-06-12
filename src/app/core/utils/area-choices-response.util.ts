export interface ExtractChoicesRecordOptions {
  /** When true, also reads `data` from the response root (area-search dynamic choices API). */
  includeDataRoot?: boolean;
}

/** Normalize county/city/zip API payloads into a key→label record. */
export function extractChoicesRecord(
  response: unknown,
  options: ExtractChoicesRecordOptions = {}
): Record<string, string> | null {
  const { includeDataRoot = false } = options;

  if (!response || typeof response !== 'object') {
    return null;
  }

  if (Array.isArray(response)) {
    const fromArray = Object.fromEntries(
      response
        .filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
        .map((entry) => [entry, entry])
    );

    return Object.keys(fromArray).length ? fromArray : null;
  }

  const root = response as Record<string, unknown>;
  const envelope = root['response'];

  if (envelope && typeof envelope === 'object') {
    const data = (envelope as Record<string, unknown>)['data'];
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, string>;
    }
  }

  if (includeDataRoot) {
    const data = root['data'];
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, string>;
    }
  }

  const skipKeys = new Set(includeDataRoot ? ['response', 'data'] : ['response']);
  const entries = Object.entries(root).filter(([key]) => !skipKeys.has(key));

  if (
    entries.length &&
    entries.every(([, value]) => typeof value === 'string' || typeof value === 'number')
  ) {
    return Object.fromEntries(entries.map(([key, value]) => [key, String(value)]));
  }

  return null;
}

export function mapChoicesRecordToSortedOptions(
  record: Record<string, string>
): { key: string; value: string }[] {
  return Object.entries(record)
    .map(([key, value]) => ({ key, value: String(value) }))
    .sort((a, b) => a.value.localeCompare(b.value));
}
