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

test('does not trust a falsely small content-length header', async () => {
  const response = new Response('12345', { headers: { 'content-length': '1' } });
  assert.deepEqual(await readBoundedResponseText(response, 4), { ok: false, reason: 'too_large' });
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

test('FIRSTLIGHT proxy bounds authentication and investigation responses and validates schema', async () => {
  const source = await readFile(new URL('../src/app/api/firstlight/investigate/route.ts', import.meta.url), 'utf8');
  assert.match(source, /readBoundedResponseText\(response,\s*MAX_BODY_BYTES\)/);
  assert.match(source, /MAX_BODY_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /readBoundedResponseText\(response,\s*MAX_AUTH_RESPONSE_BYTES\)/);
  assert.match(source, /MAX_AUTH_RESPONSE_BYTES\s*=\s*16\s*\*\s*1024/);
  assert.match(source, /new TextDecoder\('utf-8',\s*\{\s*fatal:\s*true\s*\}\)/);
  assert.match(source, /function isInvestigationResponse\(value: unknown\)/);
  assert.match(source, /integrity_summary/);
  assert.match(source, /agent_analysis/);
  assert.match(source, /value\.limitations\.every/);
  assert.doesNotMatch(source, /await\s+response\.(?:text|json)\(\)/);
});

test('report retrieval has a bounded response, timeout, UUID validation, and integrity verification', async () => {
  const source = await readFile(new URL('../src/app/api/reports/[id]/route.ts', import.meta.url), 'utf8');
  assert.match(source, /readBoundedResponseText\(response,\s*MAX_REPORT_RESPONSE_BYTES\)/);
  assert.match(source, /MAX_REPORT_RESPONSE_BYTES\s*=\s*2\s*\*\s*1024\s*\*\s*1024/);
  assert.match(source, /AbortSignal\.timeout\(8_000\)/);
  assert.match(source, /redirect:\s*'error'/);
  assert.match(source, /UUID\.test\(id\)/);
  assert.match(source, /SHA256\.test\(report\.snapshot_sha256\)/);
  assert.match(source, /integrityMatches\s*\?\s*200\s*:\s*409/);
  assert.doesNotMatch(source, /await\s+response\.(?:text|json)\(\)/);
});

test('upstream API routes do not parse unbounded JSON responses', async () => {
  const routes = [
    'api/audit/verify/route.ts',
    'api/auth/session/route.ts',
    'api/cases/notes/route.ts',
    'api/cases/route.ts',
    'api/evidence/[id]/verify/route.ts',
    'api/evidence/records/route.ts',
    'api/evidence/route.ts',
    'api/findings/route.ts',
    'api/firstlight/approvals/route.ts',
    'api/firstlight/evidence/source/route.ts',
    'api/firstlight/investigate/route.ts',
    'api/firstlight/jobs/route.ts',
    'api/firstlight/wazuh/alerts/route.ts',
    'api/reports/[id]/route.ts',
    'api/reports/route.ts',
  ];
  for (const route of routes) {
    const source = await readFile(new URL('../src/app/' + route, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /await\\s+[A-Za-z_$][\\w$]*\\.json\\(\\)/, route + ' must not parse an upstream response without a byte limit');
    if (/\\bfetch\\s*\\(/.test(source)) {
      assert.match(source, /readBoundedResponse(?:Json|Text)/, route + ' must use a bounded upstream response reader');
    }
  }
});

test('bounded response JSON helper enforces the shared byte cap before parsing', async () => {
  const source = await readFile(new URL('../src/lib/read-bounded-response-json.ts', import.meta.url), 'utf8');
  assert.match(source, /readBoundedResponseText\\(response, maxBytes\\)/);
  assert.match(source, /maxBytes = 2 \\* 1024 \\* 1024/);
  assert.match(source, /JSON\\.parse\\(bounded\\.text\\)/);
  assert.match(source, /bounded\\.reason === 'too_large'/);
});
