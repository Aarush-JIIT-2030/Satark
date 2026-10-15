# SATARK Run 6 — Engineering and Publication Ledger

**Status date:** 2026-10-15  
**Repository:** https://github.com/kaustubhdua/Satark  
**Purpose:** Track candidate security fixes and release blockers. This ledger does not claim the candidate patches are integrated or production-ready.

## Verification snapshot

- 102 isolated test executions passed, with 0 failures across rerun suites. Suites overlap; this is not 102 unique tests.
- Isolated suite results: Run 7 helper 24/24; Run 8 core security 35/35; patch contract 4/4; model-output contract 2/2; Run 10 production-smoke helpers 14/14; release integrity/audit 14/14; bounded-body helpers 9/9.
- TypeScript contract fixture passed.
- Nine curated patches passed `git apply --numstat`.
- Archive integrity passed.
- Full application install, typecheck, tests, build, tenant A/B integration, browser accessibility and live production journey remain **NOT TESTED**.
- Current main observed during Run 6: `afaf8e5501b783287a8456aac95bef0117829b20`.
- Production deployment previously observed at: `265dae7f97d7a6c1fde342db93e76dd0ccd6eedf`.
- Vercel status reported `build-rate-limit`.
- Baseline SHA discrepancy remains unresolved. Reconcile before applying candidate code patches.
- Production environment-variable names for shared Upstash rate limiting were not found in the inspected list. Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` only through authorized Vercel settings. Do not weaken fail-closed behavior.

## Publication inventory

The engineering bundle and full Run 6 report were prepared locally. Candidate patches have **not** been applied to the application source by this documentation change. The following items remain pending until code is integrated and validated.

| ID | Work item | Status | Dependencies / notes |
|---|---|---|---|
| PUB-001 | Primary integrated 19-file security patch: deterministic/model separation, local-model network safety, Upstash redirect protection, bounded evidence downloads, smoke hardening, tests/docs | Pending integration | Apply first after base SHA reconciliation; do not stack alternatives. |
| PUB-002 | Bounded request bodies for six API routes and helper tests | Pending integration | Apply after primary; reconcile overlapping route hunks. Helper suite 9/9 isolated. |
| PUB-003 | FIRSTLIGHT evidence integrity, audit helpers, case isolation, UI/persistence and release ledger | Pending integration | Isolated tests pass; UI/persistence integration not tested. Session-local history and stale-case reset require validation. Hashes alone do not prove chain of custody. |
| PUB-004 | API timeout regression tests | Pending integration | Add after route changes; verify actual timeout contracts. |
| PUB-005 | Alternative model-interpretation patch | Alternative only | Overlaps PUB-001; choose one implementation, never stack both. |
| PUB-006 | Alternative Upstash origin/redirect patch | Alternative only | Covered by PUB-001; do not stack. |
| PUB-007 | Alternative production-smoke diagnostics patches | Alternative only | Overlaps primary smoke hardening; select one implementation. |
| PUB-008 | Older combined release-hardening patch | Alternative only | Overlaps PUB-001/002/006; prefer separated candidates. |
| PUB-009 | Prior integrated 48-test bundle | Artifact recovered; not independently rerun | Represented by PUB-001; reconcile base SHA. |
| PUB-010 | Production shared rate limiting | External configuration required | Configure both Upstash variables securely in Vercel; no secret values belong in source control. |
| PUB-011 | Vercel deployment limit/storage investigation | Blocked on account visibility | Check usage, rate-limit counters, reset timing and storage; avoid unnecessary builds. |
| PUB-012 | Deploy and verify current main | Blocked | Resolve config/quota, integrate and test, then verify deployed SHA, health/version, rate limiting and benign analysis journey. |
| PUB-013 | Stale rate-limit branch reconciliation | Reviewed; no wholesale merge | `fix/fail-closed-production-rate-limit` and `fix/shared-analysis-rate-limit`; core fail-closed logic exists on main and the latter weakens production behavior. Reopen only for a unique missing fix. |
| PUB-014 | Legacy URL-fetch SSRF audit | Partially documented | Audit DNS pinning, redirects, private/loopback/link-local/metadata destinations, response caps and timeouts if legacy fetching remains in scope. |
| PUB-015 | Full app CI, tenant isolation, accessibility and release verification | Not tested end-to-end | Requires clean checkout, dependencies, synthetic tenant credentials, browser checks and production configuration. |

## Required validation sequence

1. Reconcile the exact current base SHA and candidate patch provenance.
2. In a clean checkout, apply PUB-001 first; resolve conflicts explicitly.
3. Integrate PUB-002, PUB-003 and PUB-004 in sequence, avoiding overlapping alternatives.
4. Run `cd web && npm ci && npm run typecheck && npm test && npm run build` where applicable to the current project scripts; adapt only after inspecting `package.json`.
5. Test synthetic tenant A/B isolation, upload/report boundaries, model malformed-output and timeout behavior, keyboard navigation, contrast, reduced motion and production journeys.
6. Review the diff and CI evidence before merge.
7. Configure shared rate limiting in the deployment provider, resolve Vercel capacity constraints, deploy through the normal workflow, then verify the exact deployed SHA and health/version.
8. Do not publish secrets or sensitive real incident evidence. Do not claim a passing isolated helper suite proves release readiness.

## Main code-level concern

The Run 6 source inspection found that the optional Ollama model can replace deterministic `summary`, `key_indicators` and `recommendations` in `web/src/lib/local-analysis.mjs`. The primary candidate separates model suggestions from authoritative deterministic findings. That candidate still requires full application tests before release.

## Honest release status

This ledger records prepared candidate work and isolated verification only. It does not assert that the candidate code is present on `main`, that the full application builds, that tenant isolation is proven, or that production is healthy. Do not merge or deploy until the required validation sequence is complete.
