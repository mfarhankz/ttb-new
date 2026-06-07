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
