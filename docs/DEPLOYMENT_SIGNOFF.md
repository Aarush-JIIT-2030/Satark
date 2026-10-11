# Deployment verification and release sign-off

This is an execution record. A missing result is unknown, not a pass. Repository CI does not prove that the hosted application is running the merged commit.

## Candidate identity

- Canonical repository: `kaustubhdua/Satark`
- Candidate branch: `main`
- Latest hardening merge commit: `51d840c7a3aef7f695e1a2cd63bf6e5e7952b1e1` (PR #32; API request bounds, FIRSTLIGHT import validation, frontend CI gate)
- Earlier UI baseline merge commit: `30fcffffb5fc9a0d395310ff2a121db496bf695a` (PR #28)
- UI changes: [PR #25](https://github.com/kaustubhdua/Satark/pull/25) and [PR #28](https://github.com/kaustubhdua/Satark/pull/28), merged
- Latest hardening: [PR #32](https://github.com/kaustubhdua/Satark/pull/32), merged
- Deployment repository inspected read-only: [harshilgupta926/Satark](https://github.com/harshilgupta926/Satark) — older home/FIRSTLIGHT labels remain on its `main` branch
- CI run on exact PR head `ed44973b458916cd7a9d61cd8b719d65c90f722e`: [run #842](https://github.com/kaustubhdua/Satark/actions/runs/38095332214) — PASS
- CodeQL run on exact PR head `ed44973b458916cd7a9d61cd8b719d65c90f722e`: [run #311](https://github.com/kaustubhdua/Satark/actions/runs/38095332252) — PASS
- Public demo URL: https://satark-32uppvjxwmderrchbhj7gj.streamlit.app/
- Hosting dashboard repository / branch / deployed SHA: NOT VERIFIED (dashboard access/revision evidence unavailable)
- Latest hardening checks on `51025b32c1daabfc44b8e113df5fbd213d5210fc`: [Web CI #7](https://github.com/kaustubhdua/Satark/actions/runs/38100733705) PASS; [Python CI #914](https://github.com/kaustubhdua/Satark/actions/runs/38100733730) PASS; [CodeQL #338](https://github.com/kaustubhdua/Satark/actions/runs/38100733749) PASS. These checks ran on the PR head before merge; merged commit checks and production deployment remain separate gates.
- Tester / timestamp: automated repository checks inspected 2026-10-11; live sign-off incomplete

## Automated release-candidate result

The PR #32 head `51025b32c1daabfc44b8e113df5fbd213d5210fc` passed Web CI (TypeScript check and Next.js production build), Python CI (unit tests and Streamlit browser smoke/layout checks), and CodeQL before merge. The merge commit is `51d840c7a3aef7f695e1a2cd63bf6e5e7952b1e1`. Verify the merged commit's own workflow state separately. No reproducible `web/package-lock.json` is committed yet, and no live Groq request was run.

## P0 — live demonstration smoke test

Status: **PARTIAL PASS — current public UI matches the product-style copy; NOT SIGNED OFF**. A fresh interactive browser session on 2026-10-11 rendered the home heading `Pause the panic. Find the signal.`, showed the primary actions `Open FIRSTLIGHT →`, `Start an investigation →`, and `View example report`, opened FIRSTLIGHT, and observed `Open / reset training case`. Read-only inspection of `harshilgupta926/Satark` also confirms the current `ui/home.py` and `ui/firstlight.py` contain these updated labels. This resolves the earlier stale-copy observation, but it does **not** identify the host's configured branch or deployed commit SHA, and it does not complete the full live workflow suite. The app is created by `harshilgupta926`; the canonical repo `kaustubhdua/Satark` is a different repository. GitHub integration access to the deployment repository is read-only (branch creation returned 403), and the hosting dashboard revision is not accessible.

| Check | Result | Evidence / notes |
|---|---|---|
| Hosting repository and branch | PARTIAL | Live shell identifies app creator as `harshilgupta926`; deployment repo's current home/FIRSTLIGHT copy matches the fresh live observation. Exact host branch still requires dashboard confirmation |
| Deployed revision equals approved SHA | BLOCKED | No dashboard build SHA or in-app build identifier |
| Home renders without runtime error | PASS (basic render only) | Fresh interactive browser shows current home UI and navigation; no visible runtime error. This does not verify the deployed revision |
| FIRSTLIGHT entry / training case | PARTIAL | FIRSTLIGHT opens and `Open / reset training case` is visible. The case was not loaded in this pass; deeper workflow/export tests remain outstanding |
| Evidence integrity and tampering | NOT RUN | Needs live interaction |
| Findings, timeline, gaps | NOT RUN | Needs live interaction |
| Simulated approval and rejection | NOT RUN | Needs live interaction |
| Audit-chain validation | NOT RUN | Needs live interaction |
| FIRSTLIGHT JSON export | NOT RUN | Needs live interaction |
| Scanner workflows and graceful provider failure | NOT RUN | Authorized provider credentials and controlled test inputs needed |
| URL SSRF / redirect protections | NOT RUN | Must use controlled test endpoints |
| PDF export opens and contains expected sections | NOT RUN | Needs live browser download |
| Video / image / QR scanner edge cases | NOT RUN | Needs controlled sample corpus |
| Desktop/mobile live layout | NOT RUN | Live browser blocked |
| Secret hygiene | PARTIAL / NOT VERIFIED | Repository config reviewed; live logs and browser errors not inspectable |
| Hosting-level body/time/concurrency/egress limits | NOT VERIFIED | Requires hosting configuration access |

## P1 — provider and security validation

Status: **BLOCKED pending authorized target-environment testing**.

- Model IDs are configured in `ai_provider.py`; availability to the target API account has not been verified.
- No live provider success/failure test was run in this pass. Do not infer provider health from unit tests.
- No production-host adversarial file/URL or concurrency tests were run.
- Provider data-processing/retention terms and the intended data's privacy/legal basis still require owner review.
- Continue to use synthetic or non-sensitive data until these gates are closed.

## P1 — investigation quality

Repository unit tests cover evidence hash mismatches, ID substitution, malformed evidence, evidence references, timeline ordering across timezones, malformed audit chains, simulated approval/rejection, and bounded imports. These are automated code-level checks, not a complete live or operational evaluation. A repeatable evaluation dataset and measured precision/recall, false-positive rate, grounding rate and latency remain open.

## P2 — broader-use architecture

Not a production approval. Before confidential or multi-tenant use, complete authenticated access and authorization, tenant isolation, durable case/evidence storage, protected/independently verifiable audit records, retention/deletion and backup/recovery, distributed quotas and cost controls, monitoring, incident ownership, and a measured evaluation program.

## Go / no-go

- **Supervised hackathon demo:** NO-GO for a verified release sign-off until the hosting revision is matched to the approved commit and applicable live P0 checks are run.
- **Public anonymous service with a shared provider key:** NO-GO until host-level abuse controls, global quotas and monitoring are verified.
- **Confidential / regulated data:** NO-GO until P1 identity, tenant isolation, persistence, retention, provider and recovery controls are implemented and reviewed.

## Sign-off

- Final status: **BLOCKED — repository hardening is merged and its PR-head CI/CodeQL checks passed, but production deployment SHA identity and full live smoke remain unverified; deployment write access is unavailable from this connection**
- Candidate SHA: `51d840c7a3aef7f695e1a2cd63bf6e5e7952b1e1`
- Outstanding blockers: integrate/review overlapping UI PRs #29–#31 safely; add and verify a reproducible frontend lockfile and regression tests; verify exact deployed SHA and configured host branch; run full live interactive workflows; perform authorized provider and adversarial tests; and review host controls/privacy. GitHub write access to `harshilgupta926/Satark` is unavailable to this integration.
- Accepted residual risks / owner: not yet assigned
- Rollback tested: NO / NOT VERIFIED
- Reviewer: automated repository review; human deployment owner sign-off pending
- Date: 2026-10-11
