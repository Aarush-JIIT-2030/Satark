# Local development and integration setup

This guide describes the supported local Docker Compose path for SATARK / FIRSTLIGHT. It does not imply that external integrations or production deployment are configured.

## 1. Create a local environment file

From the repository root:

```bash
cp .env.example .env
```

Fill in the four Supabase URL/key values from one **dedicated non-production Supabase project** if you want to exercise authenticated persistence. The browser URL and server URL must point to the same project. Use a publishable/anon key only; never put a Supabase service-role key in the browser or a `NEXT_PUBLIC_*` variable.

Generate two independent local API tokens:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Put one in `FIRSTLIGHT_API_TOKEN` and the other in `FIRSTLIGHT_WAZUH_SYNC_TOKEN`. Do not reuse production credentials or commit `.env`.

## 2. Start the default local stack

```bash
docker compose -f docker-compose.local.yml up --build
```

- Web UI: http://localhost:3000
- Streamlit UI: http://localhost:8501
- FIRSTLIGHT API: internal Compose network only, port 8788
- Ollama: internal Compose network only, port 11434

The default stack is for local development. A healthy container means only that its health check passed; it does not prove that Supabase RLS, Wazuh ingestion, evidence integrity, or end-to-end authorization works.

## 3. Enable Wazuh ingestion only in an authorized lab

The persistent Wazuh worker is an opt-in profile. Before starting it, configure all of the following in `.env`:

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the dedicated test project. Keep the service-role key only in the private worker runtime.
- `FIRSTLIGHT_WAZUH_TENANT_ID`, `FIRSTLIGHT_WAZUH_CASE_ID`, and `FIRSTLIGHT_WAZUH_ACTOR_ID` identifying an authorized disposable case and member.
- `FIRSTLIGHT_WAZUH_INITIAL_SINCE` as a timezone-qualified ISO-8601 timestamp.
- HTTPS Wazuh Indexer URL, a dedicated read-only username/password, and a restrictive list of authorized agent IDs.

Only after reviewing the target and the test tenant should the worker be started:

```bash
docker compose -f docker-compose.local.yml --profile wazuh-worker up --build
```

Do not enable the profile against a shared production database or unapproved endpoints. Use HTTPS and certificate verification; `FIRSTLIGHT_WAZUH_ALLOW_HTTP=true` is for isolated lab-only cases and should not be used on a public network.

## 4. Enable durable investigation jobs only after migration and fixture review

The investigation worker requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in its private runtime. It claims and processes persisted jobs, so start it only after the reviewed migrations have been applied to the isolated test project and a disposable case is ready:

```bash
docker compose -f docker-compose.local.yml --profile investigation-worker up --build
```

Do not start both worker profiles against the same production tenant as an experiment. Never use the shared production database as a test fixture.

## 5. Run repository checks

Python tests:

```bash
python -m pip install -r requirements.txt
python -m pip install -r firstlight-api-requirements.txt pytest
python -m pip check
python -m unittest discover -s tests -v
python -m pytest -q tests/test_firstlight_api.py tests/test_firstlight_engine.py tests/test_firstlight_agents.py tests/test_firstlight_wazuh.py tests/test_firstlight_wazuh_worker.py tests/test_firstlight_investigation_worker.py
```

Web tests:

```bash
cd web
npm ci
npm run test:ci
npm run test:browser
```

The live Supabase tenant-isolation suite requires three separate, non-admin test identities and disposable tenant fixtures. Follow [the tenant-isolation setup guide](SUPABASE_TENANT_TEST_SETUP.md) and run `npm run test:integration` from `web/`. Missing fixtures must not be treated as a pass.

## 6. Production is a separate release decision

Before a production release, reconcile the migration history against the intended project, run the live tenant-isolation suite, verify real authorized telemetry from an isolated lab, independently validate evidence exports and hashes, and smoke-test the exact deployed commit. See [Release readiness](RELEASE_READINESS.md) and [Deployment sign-off](DEPLOYMENT_SIGNOFF.md).

The current code can contain functioning components while the platform remains **not release-ready**. Do not claim production readiness based on a successful build alone.
