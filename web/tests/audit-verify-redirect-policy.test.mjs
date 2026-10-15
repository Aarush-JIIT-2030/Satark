import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/app/api/audit/verify/route.ts', import.meta.url), 'utf8');

test('audit-chain verification rejects redirects on its authenticated Supabase RPC request', () => {
  const match = source.match(/fetch\(url\.origin \+ '\/rest\/v1\/rpc\/satark_verify_audit_chain', \{([\s\S]*?)\n    \}\);/);
  assert.ok(match, 'audit verification RPC fetch must exist');
  assert.match(match[1], /\bredirect\s*:\s*['"]error['"]/, 'RPC request must reject redirects');
});
