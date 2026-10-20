import { readBoundedResponseText } from '@/lib/read-bounded-response.mjs';

export type BoundedResponseJsonError = 'too_large' | 'unreadable';

/**
 * Read and parse an upstream JSON response only after enforcing a hard byte
 * limit on the actual stream. A Content-Length header is only an early hint;
 * the underlying reader also enforces the limit for chunked or misreported
 * responses.
 *
 * Throws on oversized, unreadable, or invalid JSON responses so route-level
 * error handlers can fail closed rather than forwarding partial data.
 */
export async function readBoundedResponseJson(
  response: Response,
  maxBytes = 2 * 1024 * 1024,
): Promise<unknown> {
  const bounded = await readBoundedResponseText(response, maxBytes);
  if (!bounded.ok) {
    throw new Error(bounded.reason === 'too_large'
      ? 'Upstream JSON response exceeded the size limit.'
      : 'Upstream JSON response could not be read.');
  }
  try {
    return JSON.parse(bounded.text) as unknown;
  } catch {
    throw new Error('Upstream service returned invalid JSON.');
  }
}
