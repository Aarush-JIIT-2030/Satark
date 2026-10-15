import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./tenant-isolation.integration.test.mjs', import.meta.url), 'utf8');

test('tenant integration probes have bounded network timeouts', () => {
  assert.match(source, /AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(source, /const REQUEST_TIMEOUT_MS = 8_000/);
});

test('cross-tenant create is accepted as denied only for authorization responses', () => {
  assert.match(source, /\[401, 403\]\.includes\(write\.status\)/);
  assert.doesNotMatch(source, /\[401, 403, 409, 422\]\.includes\(write\.status\)/);
});

test('viewer create requires an authorization denial and viewer update cannot silently skip', () => {
  assert.match(source, /\[401, 403\]\.includes\(create\.status\)/);
  assert.match(source, /rows\.length > 0/);
  assert.match(source, /assert\.deepEqual\(await update\.json\(\), \[\]/);
});
