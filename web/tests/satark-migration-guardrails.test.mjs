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

test('audit-verification RPC keeps the exposed wrapper invoker-only', () => {
  const sql = migration('20261018114205_harden_satark_audit_verification_rpc.sql');
  assert.match(sql, /create\s+or\s+replace\s+function\s+satark_private\.verify_audit_chain[\s\S]*?security\s+definer\s+set\s+search_path\s*=\s*''/i,
    'private audit verifier must remain SECURITY DEFINER with an empty search_path');
  assert.match(sql, /create\s+or\s+replace\s+function\s+public\.satark_verify_audit_chain[\s\S]*?language\s+plpgsql\s+set\s+search_path\s*=\s*''[\s\S]*?return\s+query\s+select\s+\*\s+from\s+satark_private\.verify_audit_chain/i,
    'public audit verifier must be an invoker wrapper around the private implementation');
  assert.match(sql, /revoke\s+all\s+on\s+function\s+public\.satark_verify_audit_chain\(uuid\)\s+from\s+public,\s*anon/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.satark_verify_audit_chain\(uuid\)\s+to\s+authenticated/i);
  assert.doesNotMatch(sql, /create\s+or\s+replace\s+function\s+public\.satark_verify_audit_chain[\s\S]*?security\s+definer/i,
    'exposed audit RPC must not be SECURITY DEFINER');
});

test('tenant-creation RPC preserves authenticated ownership and an invoker-only public wrapper', () => {
  const sql = migration('20261018114247_harden_satark_tenant_creation_rpc.sql');
  assert.match(sql, /create\s+or\s+replace\s+function\s+satark_private\.create_tenant[\s\S]*?security\s+definer\s+set\s+search_path\s*=\s*''/i,
    'private tenant creator must remain SECURITY DEFINER with an empty search_path');
  assert.match(sql, /actor\s+uuid\s*:=\s*auth\.uid\(\)/i,
    'tenant ownership must derive from the authenticated actor');
  assert.match(sql, /insert\s+into\s+public\.satark_memberships\s*\(tenant_id,\s*user_id,\s*role\)[\s\S]*?values\s*\(created_tenant,\s*actor,\s*'owner'\)/i,
    'creator must grant ownership only to the authenticated actor');
  assert.match(sql, /insert\s+into\s+public\.satark_audit_events/i,
    'tenant creation must append its audit event atomically');
  assert.match(sql, /create\s+or\s+replace\s+function\s+public\.satark_create_tenant[\s\S]*?language\s+plpgsql\s+set\s+search_path\s*=\s*''[\s\S]*?return\s+satark_private\.create_tenant\(tenant_name\)/i,
    'public tenant creator must be an invoker wrapper');
  assert.match(sql, /revoke\s+all\s+on\s+function\s+public\.satark_create_tenant\(text\)\s+from\s+public,\s*anon/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.satark_create_tenant\(text\)\s+to\s+authenticated/i);
  assert.doesNotMatch(sql, /create\s+or\s+replace\s+function\s+public\.satark_create_tenant[\s\S]*?security\s+definer/i,
    'exposed tenant creation RPC must not be SECURITY DEFINER');
});
