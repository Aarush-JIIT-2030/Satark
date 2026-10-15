import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const routes = [
  '../src/app/api/evidence/route.ts',
  '../src/app/api/findings/route.ts',
  '../src/app/api/reports/route.ts',
];

for (const route of routes) {
  const source = fs.readFileSync(new URL(route, import.meta.url), 'utf8');
  test(route + ' rejects redirects for every authenticated upstream request', () => {
    const fetchCalls = source.match(/fetch\([\s\S]*?\)/g) || [];
    assert.ok(fetchCalls.length >= 3, 'expected auth plus storage/read/write requests');
    const redirectOptions = source.match(/redirect\s*:\s*['"]error['"]/g) || [];
    assert.equal(redirectOptions.length, fetchCalls.length, 'every upstream fetch must explicitly reject redirects');
  });
}
