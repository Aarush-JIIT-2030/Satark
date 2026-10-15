# SATARK web CI: isolated Supabase test environment

The web integration job deliberately fails closed when its required GitHub Actions secrets are missing. It must not silently skip tenant-isolation checks and report a green release gate.

## Required repository Actions secrets

Configure these in the repository's GitHub Actions secrets settings:

- `SATARK_TEST_SUPABASE_URL`: URL of a dedicated non-production Supabase project.
- `SATARK_TEST_SUPABASE_PUBLISHABLE_KEY`: publishable/anon key for that project; never use a service-role key.
- `SATARK_TEST_USER_A_EMAIL`, `SATARK_TEST_USER_A_PASSWORD`, `SATARK_TEST_TENANT_A_ID`: dedicated user and tenant A.
- `SATARK_TEST_USER_B_EMAIL`, `SATARK_TEST_USER_B_PASSWORD`, `SATARK_TEST_TENANT_B_ID`: separate dedicated user and tenant B.
- `SATARK_TEST_VIEWER_EMAIL`, `SATARK_TEST_VIEWER_PASSWORD`, `SATARK_TEST_VIEWER_TENANT_ID`: a dedicated read-only/viewer account and its tenant.

## Safety requirements

1. Use only synthetic test data in a separate non-production Supabase project.
2. The two tenant test users must be different non-admin users; tenant A and tenant B IDs must differ.
3. The viewer account must actually have the viewer role through the application's normal authorization model.
4. Do not use production customer accounts, production tenant IDs, service-role credentials, or personal evidence.
5. Rotate test passwords if they are exposed, and keep them only in GitHub Actions secrets.
6. The integration suite currently probes case reads/writes and viewer permissions. It does **not** by itself prove every evidence-storage, report, deletion, backup/restore or production RLS behavior. Those require additional tests and explicit acceptance.
7. A green CI job proves the tested synthetic-user paths against the configured test project, not that production uses the same schema/policies. Verify migration parity before release.

## Run locally

From `web/`, set the same environment variables in a secure local shell and run:

```sh
npm ci
npm run test:integration
```

Do not commit a populated `.env` file or print secret values in logs.
