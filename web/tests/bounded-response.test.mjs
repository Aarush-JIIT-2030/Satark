import test from 'node:test';
import assert from 'node:assert/strict';
import { readBoundedResponseText } from '../src/lib/read-bounded-response.mjs';

test('accepts a response exactly at the byte limit', async () => {
  const response = new Response('1234', { headers: { 'content-length': '4' } });
  assert.deepEqual(await readBoundedResponseText(response, 4), { ok: true, text: '1234' });
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
  assert.deepEqual(await readBoundedResponseText(new Response('🛡️'), 8), { ok: true, text: '🛡️' });
  assert.deepEqual(await readBoundedResponseText(new Response('🛡️'), 7), { ok: false, reason: 'too_large' });
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
