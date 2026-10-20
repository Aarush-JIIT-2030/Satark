import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readBoundedResponseText } from '../src/lib/read-bounded-response.mjs';

test('accepts a response exactly at the UTF-8 byte limit', async () => {
  assert.deepEqual(await readBoundedResponseText(new Response('🛡️'), 7), { ok: true, text: '🛡️' });
});

test('rejects an oversized declared response before reading its body', async () => {
  const response = new Response('12345', { headers: { 'content-length': '5' } });
  assert.deepEqual(await readBoundedResponseText(response, 4), { ok: false, reason: 'too_large' });
});

test('enforces the streamed byte limit when content-length is absent', async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('123'));
      controller.enqueue(new TextEncoder().encode('45'));
      controller.close();
    },
  });
  assert.deepEqual(await readBoundedResponseText(new Response(stream), 4), { ok: false, reason: 'too_large' });
});

test('counts UTF-8 bytes rather than JavaScript characters', async () => {
  assert.deepEqual(await readBoundedResponseText(new Response('🛡️'), 6), { ok: false, reason: 'too_large' });
});

test('rejects malformed UTF-8 rather than returning corrupted text', async () => {
  const response = new Response(new Uint8Array([0xc3, 0x28]));
  assert.deepEqual(await readBoundedResponseText(response, 8), { ok: false, reason: 'unreadable' });
});

test('rejects invalid limits and malformed length headers', async () => {
  assert.deepEqual(await readBoundedResponseText(new Response('x'), 0), { ok: false, reason: 'unreadable' });
  const response = new Response('x', { headers: { 'content-length': 'unknown' } });
  assert.deepEqual(await readBoundedResponseText(response, 8), { ok: false, reason: 'unreadable' });
});

test('FIRSTLIGHT proxy bounds authentication and investigation responses and validates JSON objects', async () => {
  const source = await readFile(new URL('../src/app/api/firstlight/investigate/route.ts', import.meta.url), 'utf8');
  assert.match(source, /readBoundedResponseText\(response,\s*MAX_BODY_BYTES\)/);
  assert.match(source, /MAX_BODY_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /readBoundedResponseText\(response,\s*MAX_AUTH_RESPONSE_BYTES\)/);
  assert.match(source, /MAX_AUTH_RESPONSE_BYTES\s*=\s*16\s*\*\s*1024/);
  assert.match(source, /new TextDecoder\('utf-8',\s*\{\s*fatal:\s*true\s*\}\)/);
  assert.match(source, /!payload\s*\|\|\s*typeof payload !== 'object'\s*\|\|\s*Array\.isArray\(payload\)/);
  assert.doesNotMatch(source, /await\s+response\.(?:text|json)\(\)/);
});
