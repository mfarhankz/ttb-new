/**
 * Legacy utilFactory.fixInvalidJSONResponse — some pipeline responses (notably
 * get_search_fields) can be truncated when third-party cookies are blocked.
 */
export function repairTruncatedLegacyJson(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    const suffixes = ['}]', '}', ']'];
    for (const suffix of suffixes) {
      try {
        const repaired = `${trimmed}${suffix}`;
        JSON.parse(repaired);
        return repaired;
      } catch {
        // try next suffix
      }
    }

    return trimmed;
  }
}

/** Extract a human-readable message from legacy TTB `{ response: { status, message, data } }` envelopes. */
export function extractTtbErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const root = data as Record<string, unknown>;
  const envelope =
    root['response'] && typeof root['response'] === 'object'
      ? (root['response'] as Record<string, unknown>)
      : root['status'] === 'ERROR'
        ? root
        : null;

  if (!envelope || envelope['status'] !== 'ERROR') {
    return null;
  }

  return coalesceTtbMessage(envelope);
}

function coalesceTtbMessage(envelope: Record<string, unknown>): string | null {
  if (typeof envelope['message'] === 'string' && envelope['message'].trim()) {
    return envelope['message'].trim();
  }

  const data = envelope['data'];

  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }

  if (Array.isArray(data) && data.length) {
    const first = data[0];
    if (typeof first === 'string' && first.trim()) {
      return first.trim();
    }

    if (first && typeof first === 'object') {
      const record = first as Record<string, unknown>;
      if (typeof record['message'] === 'string' && record['message']) {
        return String(record['message']);
      }

      if (typeof record['msg'] === 'string' && record['msg']) {
        return String(record['msg']);
      }
    }
  }

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (typeof record['message'] === 'string' && record['message']) {
      return String(record['message']);
    }

    if (typeof record['msg'] === 'string' && record['msg']) {
      return String(record['msg']);
    }
  }

  return null;
}
