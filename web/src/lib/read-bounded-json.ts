export type BoundedBodyResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; status: 400 | 413; error: string };

export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Read a request body with a hard byte cap enforced against the actual stream.
 * Content-Length is an early hint, never the sole limit for chunked requests.
 */
export async function readBoundedBody(request: Request, maxBytes: number): Promise<BoundedBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    return { ok: false, status: 400, error: 'Invalid body size limit.' };
  }
  const declared = request.headers.get('content-length');
  if (declared !== null) {
    if (!/^\\d+$/.test(declared)) return { ok: false, status: 400, error: 'Invalid Content-Length.' };
    const length = Number(declared);
    if (!Number.isSafeInteger(length)) return { ok: false, status: 400, error: 'Invalid Content-Length.' };
    if (length > maxBytes) return { ok: false, status: 413, error: 'Request body is too large.' };
  }
  if (!request.body) return { ok: false, status: 400, error: 'A request body is required.' };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        void reader.cancel().catch(() => undefined);
        return { ok: false, status: 413, error: 'Request body is too large.' };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: 'Could not read request body.' };
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

/** Parse JSON only after enforcing a byte limit against the actual request stream. */
export async function readBoundedJson(request: Request, maxBytes: number): Promise<BoundedJsonResult> {
  const bounded = await readBoundedBody(request, maxBytes);
  if (!bounded.ok) return bounded;
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bounded.bytes);
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, status: 400, error: 'A valid JSON object is required.' };
  }
}
