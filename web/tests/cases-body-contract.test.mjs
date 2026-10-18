import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('case API streams and bounds request bodies before parsing JSON', async () => {
  const source = await readFile(new URL('../src/app/api/cases/route.ts', import.meta.url), 'utf8');
  assert.ok(source.includes('async function readBoundedJson(request: Request)'));
  assert.ok(source.includes('request.body.getReader()'), 'case API should read incrementally');
  assert.ok(source.includes('totalBytes += value.byteLength'), 'body limit must count actual streamed bytes');
  assert.ok(source.includes('if (totalBytes > MAX_BODY_BYTES)'), 'chunked requests must not bypass the limit');
  assert.ok(source.includes('await reader.cancel()'), 'oversized uploads should stop being consumed');
  assert.ok(!source.includes('await request.text()'), 'case API must not buffer an unbounded request before checking size');
  assert.equal((source.match(/readBoundedJson\(request\)/g) || []).length, 3,
    'both case creation and update should use the shared bounded parser');
});
