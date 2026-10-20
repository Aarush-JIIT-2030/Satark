import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const migration = (name) => readFileSync(
  resolve(repoRoot, 'supabase', 'migrations', name),
  'utf8',
);

test('SATARK foreign-key index migration covers all five known support indexes', () => {
  const sql = migration('20261020050000_satark_foreign_key_support_indexes.sql');
  const expected = [
    ['satark_approvals_requested_by_idx', 'satark_approvals', 'requested_by'],
    ['satark_approvals_decided_by_idx', 'satark_approvals', 'decided_by'],
    ['satark_case_notes_created_by_idx', 'satark_case_notes', 'created_by'],
    ['satark_cases_assigned_to_idx', 'satark_cases', 'assigned_to'],
    ['satark_investigation_jobs_requested_by_idx', 'satark_investigation_jobs', 'requested_by'],
  ];

  for (const [index, table, column] of expected) {
    assert.match(
      sql,
      new RegExp('create\\s+index\\s+if\\s+not\\s+exists\\s+' + index + '\\s+on\\s+public\\.' + table + '\\s*\\(\\s*' + column + '\\s*\\)', 'i'),
      `missing idempotent support index ${index}`,
    );
  }

  assert.doesNotMatch(sql, /drop\s+(table|schema|index)\b|truncate\b|delete\s+from\b/i,
    'support-index migration must not delete or destructively replace data');
});

test('SATARK membership-policy repair rebinds all six policies to the private helper', () => {
  const sql = migration('20261020051000_satark_rebind_membership_policies.sql');
  const policies = [
    'satark_approvals_member_read',
    'satark_approvals_request',
    'satark_case_notes_member_read',
    'satark_case_notes_analyst_insert',
    'satark_investigation_jobs_member_read',
    'satark_investigation_jobs_member_enqueue',
  ];

  for (const policy of policies) {
    assert.match(sql, new RegExp('create\\s+policy\\s+' + policy + '\\b', 'i'),
      `missing repaired policy ${policy}`);
  }

  assert.equal((sql.match(/satark_private\.has_membership\s*\(/gi) || []).length, 6,
    'each repaired policy must call the private membership helper');
  assert.doesNotMatch(sql, /public\.satark_has_membership\s*\(/i,
    'policies must not depend on the revoked public wrapper');
  assert.doesNotMatch(sql, /drop\s+table\b|truncate\b|delete\s+from\b/i,
    'policy repair must not alter or delete application data');
  assert.match(sql, /requested_by\s*=\s*\(select auth\.uid\(\)\)/i,
    'job/approval creation must remain bound to the authenticated actor');
  assert.match(sql, /status\s*=\s*'pending'/i,
    'approval requests must start pending');
  assert.match(sql, /status\s*=\s*'queued'/i,
    'investigation jobs must start queued');
});
