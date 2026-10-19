import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('FIRSTLIGHT API bounds streamed request bytes before JSON parsing', async () => {
  const source = await readFile(new URL('../src/app/api/firstlight/investigate/route.ts', import.meta.url), 'utf8');
  assert.ok(source.includes("const MAX_BODY_BYTES = 2 * 1024 * 1024"));
  assert.ok(source.includes("request.body?.getReader()"), 'request must be read incrementally');
  assert.ok(source.includes('totalBytes += value.byteLength'), 'actual streamed bytes must be counted');
  assert.ok(source.includes('if (totalBytes > MAX_BODY_BYTES)'), 'chunked requests must be rejected at the byte limit');
  assert.ok(source.includes("return reply({ error: 'Investigation request is too large.' }, 413)"), 'oversized request must return 413');
  assert.ok(source.includes("void reader.cancel().catch(() => undefined)"), 'cancellation failure must not change the oversized response');
  assert.ok(!source.includes('await request.text()'), 'the endpoint must not buffer an unbounded body before checking its size');
});


test('saved FIRSTLIGHT evidence reload preserves its original browser digest', async () => {
  const source = await readFile(new URL('../src/app/firstlight/persistent-case-panel.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes("digest: typeof row.metadata?.browser_record_sha256 === 'string' ? row.metadata.browser_record_sha256 : ''"),
    'the server envelope hash must not be substituted for the browser canonical evidence hash');
  assert.ok(source.includes('never substitute a different hash'),
    'the integrity boundary must remain documented beside the mapping');
});


test('saved FIRSTLIGHT reports include the visible session audit and simulated decisions', async () => {
  const source = await readFile(new URL('../src/app/firstlight/persistent-case-panel.tsx', import.meta.url), 'utf8');
  assert.ok(source.includes('audit_events_visible_in_session: audit.map(event => ({ ...event }))'),
    'the saved report must preserve the session audit instead of exporting an empty array');
  assert.ok(source.includes('simulated_response_decisions: [...actions]'),
    'the saved report must preserve the explicit simulated response decisions');
  assert.ok(source.includes('Database-triggered audit events are separate from this session log'),
    'session events must not be misrepresented as server audit events');
});
