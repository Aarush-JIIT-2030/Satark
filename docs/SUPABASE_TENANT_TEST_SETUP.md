# SATARK tenant-isolation CI test environment

This is an **isolated test-project setup**, not a production migration. It provisions disposable identities and records so the real PostgREST/RLS integration tests can exercise tenant boundaries. Never run the fixture SQL against the shared production Supabase project.

## 1. Create a dedicated Supabase test project

1. Create or select a separate Supabase project used only for SATARK integration tests.
2. Apply the repository's SATARK schema migrations to that project from a trusted checkout. Reconcile migration history and preview pending migrations before applying anything; do not use a broad `db push` against the shared production project.
3. Verify the test project's project reference in the Supabase dashboard before proceeding.
4. In Authentication, create three confirmed, non-admin users:
   - Tenant A owner
   - Tenant B owner
   - Viewer
5. Use unique test-only email addresses and strong random passwords. Do not reuse production user accounts or credentials.

## 2. Seed disposable tenant fixtures

Open the **SQL Editor of the dedicated test project only**. Replace the three email placeholders below with the exact test-user email addresses created in step 1, then run the script. It creates three tenant memberships, one disposable case per tenant, and linked evidence, finding, report, note, investigation-job, and simulation-only approval fixtures so cross-tenant reads have real rows to protect. It does not create or change Auth users or passwords.

```sql
do $$
declare
  user_a uuid;
  user_b uuid;
  user_viewer uuid;
  tenant_a constant uuid := 'a1000000-0000-4000-8000-000000000001';
  tenant_b constant uuid := 'b2000000-0000-4000-8000-000000000002';
  tenant_viewer constant uuid := 'c3000000-0000-4000-8000-000000000003';
  case_a constant uuid := 'a1000000-0000-4000-8000-000000000011';
  case_b constant uuid := 'b2000000-0000-4000-8000-000000000022';
  case_viewer constant uuid := 'c3000000-0000-4000-8000-000000000033';
  note_a constant uuid := 'a1000000-0000-4000-8000-000000000012';
  note_b constant uuid := 'b2000000-0000-4000-8000-000000000023';
  note_viewer constant uuid := 'c3000000-0000-4000-8000-000000000034';
  job_a constant uuid := 'a1000000-0000-4000-8000-000000000013';
  job_b constant uuid := 'b2000000-0000-4000-8000-000000000024';
  job_viewer constant uuid := 'c3000000-0000-4000-8000-000000000035';
  approval_a constant uuid := 'a1000000-0000-4000-8000-000000000014';
  approval_b constant uuid := 'b2000000-0000-4000-8000-000000000025';
  approval_viewer constant uuid := 'c3000000-0000-4000-8000-000000000036';
  evidence_a constant uuid := 'a1000000-0000-4000-8000-000000000015';
  evidence_b constant uuid := 'b2000000-0000-4000-8000-000000000026';
  evidence_viewer constant uuid := 'c3000000-0000-4000-8000-000000000037';
  finding_a constant uuid := 'a1000000-0000-4000-8000-000000000016';
  finding_b constant uuid := 'b2000000-0000-4000-8000-000000000027';
  finding_viewer constant uuid := 'c3000000-0000-4000-8000-000000000038';
  report_a constant uuid := 'a1000000-0000-4000-8000-000000000017';
  report_b constant uuid := 'b2000000-0000-4000-8000-000000000028';
  report_viewer constant uuid := 'c3000000-0000-4000-8000-000000000039';
begin
  select id into strict user_a from auth.users
    where lower(email) = lower('REPLACE_WITH_TENANT_A_EMAIL');
  select id into strict user_b from auth.users
    where lower(email) = lower('REPLACE_WITH_TENANT_B_EMAIL');
  select id into strict user_viewer from auth.users
    where lower(email) = lower('REPLACE_WITH_VIEWER_EMAIL');

  if user_a = user_b or user_a = user_viewer or user_b = user_viewer then
    raise exception 'Test accounts must be three distinct Auth users';
  end if;

  insert into public.satark_tenants(id, name) values
    (tenant_a, 'SATARK CI Tenant A'),
    (tenant_b, 'SATARK CI Tenant B'),
    (tenant_viewer, 'SATARK CI Viewer Tenant')
  on conflict (id) do update set name = excluded.name;

  insert into public.satark_memberships(tenant_id, user_id, role) values
    (tenant_a, user_a, 'owner'),
    (tenant_b, user_b, 'owner'),
    (tenant_viewer, user_viewer, 'viewer')
  on conflict (tenant_id, user_id) do update set role = excluded.role;

  insert into public.satark_cases(id, tenant_id, title, status, severity, created_by, metadata) values
    (case_a, tenant_a, 'Disposable CI case A', 'open', 'low', user_a, '{"test_fixture":true}'::jsonb),
    (case_b, tenant_b, 'Disposable CI case B', 'open', 'low', user_b, '{"test_fixture":true}'::jsonb),
    (case_viewer, tenant_viewer, 'Disposable viewer CI case', 'open', 'low', user_viewer, '{"test_fixture":true}'::jsonb)
  on conflict (id) do update set
    tenant_id = excluded.tenant_id,
    title = excluded.title,
    status = 'open',
    severity = 'low',
    created_by = excluded.created_by,
    metadata = '{"test_fixture":true}'::jsonb;

  insert into public.satark_case_notes(id, tenant_id, case_id, body, created_by) values
    (note_a, tenant_a, case_a, 'Disposable CI note A', user_a),
    (note_b, tenant_b, case_b, 'Disposable CI note B', user_b),
    (note_viewer, tenant_viewer, case_viewer, 'Disposable viewer CI note', user_viewer)
  on conflict (id) do nothing;

  insert into public.satark_investigation_jobs(
    id, tenant_id, case_id, requested_by, idempotency_key, status, attempts, max_attempts
  ) values
    (job_a, tenant_a, case_a, user_a, 'ci-fixture-a-001', 'queued', 0, 3),
    (job_b, tenant_b, case_b, user_b, 'ci-fixture-b-001', 'queued', 0, 3),
    (job_viewer, tenant_viewer, case_viewer, user_viewer, 'ci-fixture-viewer-001', 'queued', 0, 3)
  on conflict (id) do nothing;

  insert into public.satark_approvals(
    id, tenant_id, case_id, action_key, action_payload, payload_sha256, status, requested_by
  ) values
    (approval_a, tenant_a, case_a, 'simulation.tenant_isolation_probe', '{"mode":"simulation","test_fixture":true}'::jsonb, repeat('a', 64), 'pending', user_a),
    (approval_b, tenant_b, case_b, 'simulation.tenant_isolation_probe', '{"mode":"simulation","test_fixture":true}'::jsonb, repeat('b', 64), 'pending', user_b),
    (approval_viewer, tenant_viewer, case_viewer, 'simulation.tenant_isolation_probe', '{"mode":"simulation","test_fixture":true}'::jsonb, repeat('c', 64), 'pending', user_viewer)
  on conflict (id) do nothing;

  insert into public.satark_evidence(
    id, tenant_id, case_id, source_label, event_kind, observed_at, summary,
    source_sha256, record_sha256, metadata, created_by
  ) values
    (evidence_a, tenant_a, case_a, 'CI fixture', 'test', now(), 'Disposable CI evidence A', null, repeat('1', 64), '{"test_fixture":true}'::jsonb, user_a),
    (evidence_b, tenant_b, case_b, 'CI fixture', 'test', now(), 'Disposable CI evidence B', null, repeat('2', 64), '{"test_fixture":true}'::jsonb, user_b),
    (evidence_viewer, tenant_viewer, case_viewer, 'CI fixture', 'test', now(), 'Disposable viewer CI evidence', null, repeat('3', 64), '{"test_fixture":true}'::jsonb, user_viewer)
  on conflict (id) do nothing;

  insert into public.satark_findings(
    id, tenant_id, case_id, finding_key, title, severity, detail,
    evidence_refs, source, confidence, created_by
  ) values
    (finding_a, tenant_a, case_a, 'ci-fixture-a', 'Disposable CI finding A', 'unknown', 'Test-only finding A', '[]'::jsonb, 'CI fixture', null, user_a),
    (finding_b, tenant_b, case_b, 'ci-fixture-b', 'Disposable CI finding B', 'unknown', 'Test-only finding B', '[]'::jsonb, 'CI fixture', null, user_b),
    (finding_viewer, tenant_viewer, case_viewer, 'ci-fixture-viewer', 'Disposable viewer CI finding', 'unknown', 'Test-only viewer finding', '[]'::jsonb, 'CI fixture', null, user_viewer)
  on conflict (id) do nothing;

  insert into public.satark_reports(
    id, tenant_id, case_id, title, report_version, snapshot, snapshot_sha256, created_by
  ) values
    (report_a, tenant_a, case_a, 'Disposable CI report A', 1, '{"test_fixture":true}'::jsonb, repeat('d', 64), user_a),
    (report_b, tenant_b, case_b, 'Disposable CI report B', 1, '{"test_fixture":true}'::jsonb, repeat('e', 64), user_b),
    (report_viewer, tenant_viewer, case_viewer, 'Disposable viewer CI report', 1, '{"test_fixture":true}'::jsonb, repeat('f', 64), user_viewer)
  on conflict (id) do nothing;

end $$;

select
  t.id,
  t.name,
  (select count(*) from public.satark_memberships m where m.tenant_id = t.id) as memberships,
  (select count(*) from public.satark_cases c where c.tenant_id = t.id) as cases,
  (select count(*) from public.satark_evidence e where e.tenant_id = t.id) as evidence,
  (select count(*) from public.satark_findings f where f.tenant_id = t.id) as findings,
  (select count(*) from public.satark_reports r where r.tenant_id = t.id) as reports,
  (select count(*) from public.satark_audit_events e where e.tenant_id = t.id) as audit_events,
  (select count(*) from public.satark_case_notes n where n.tenant_id = t.id) as notes,
  (select count(*) from public.satark_investigation_jobs j where j.tenant_id = t.id) as jobs,
  (select count(*) from public.satark_approvals a where a.tenant_id = t.id) as approvals
from public.satark_tenants t
where t.id in (
  'a1000000-0000-4000-8000-000000000001',
  'b2000000-0000-4000-8000-000000000002',
  'c3000000-0000-4000-8000-000000000003'
)
order by t.id;
```

Confirm exactly three tenant rows are returned and each row reports `memberships = 1`, `cases = 1`, `evidence = 1`, `findings = 1`, `reports = 1`, `notes = 1`, `jobs = 1`, and `approvals = 1`, with `audit_events > 0`. The seed is safe to re-run: case fixtures are normalized and child fixtures use stable IDs with conflict-ignore semantics. These fixture IDs are stable so CI secrets can be configured once; they are not production identifiers.

## 3. Configure GitHub Actions secrets

In the SATARK GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add the following names, using the dedicated test project URL, its publishable key, the three test accounts' credentials, and the matching tenant IDs from the SQL above:

- `SATARK_TEST_SUPABASE_URL`
- `SATARK_TEST_SUPABASE_PUBLISHABLE_KEY`
- `SATARK_TEST_USER_A_EMAIL`
- `SATARK_TEST_USER_A_PASSWORD`
- `SATARK_TEST_TENANT_A_ID` = `a1000000-0000-4000-8000-000000000001`
- `SATARK_TEST_USER_B_EMAIL`
- `SATARK_TEST_USER_B_PASSWORD`
- `SATARK_TEST_TENANT_B_ID` = `b2000000-0000-4000-8000-000000000002`
- `SATARK_TEST_VIEWER_EMAIL`
- `SATARK_TEST_VIEWER_PASSWORD`
- `SATARK_TEST_VIEWER_TENANT_ID` = `c3000000-0000-4000-8000-000000000003`

Use the Supabase **publishable/anon client key only**. Never put a service-role key, database password, or personal account credential in GitHub Actions secrets for this test. Do not paste secret values into issues, pull requests, logs, or chat.

## 4. Verify the real test

1. Re-run the CI workflow for the tenant-isolation PR.
2. Confirm **Supabase tenant-isolation integration** passes and the real test cases execute; a skipped test is not a pass.
3. Confirm Next.js validation, production browser/accessibility smoke, Python/FIRSTLIGHT tests, and CodeQL also pass.
4. Review the CI log for accidental fixture data or credential disclosure.
5. Keep the PR unmerged until all required checks pass.

The integration test intentionally fails when any required fixture is missing. This guide only enables the test environment; it does not prove that the live production schema is repaired or that production tenant isolation is verified.

## Cleanup

After the tests are no longer needed, remove the three test users from the dedicated test project's Auth dashboard and remove the fixture tenants and all associated SATARK test records there if desired. Never clean up by running broad deletes on the shared production project.
