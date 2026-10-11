# Release execution checklist

Candidate: `main` at `51b493d1f945c5d991ded95d57cda4066802c810`.

## Current evidence
- Frontend CI passed: https://github.com/kaustubhdua/Satark/actions/runs/38114820130
- Python CI passed: https://github.com/kaustubhdua/Satark/actions/runs/38114820139
- CodeQL/Python analysis passed: https://github.com/kaustubhdua/Satark/actions/runs/38114820134
- Vercel deployment rate limit was reported; exact live SHA was not confirmed.
- Live provider and full deployed workflow testing remain unverified.

## Release gates
- [ ] Resolve Vercel rate limit and confirm canonical project is linked to kaustubhdua/Satark and main.
- [ ] Deploy the exact candidate SHA and record URL, deployment ID, environment, SHA and timestamp.
- [ ] Confirm production alias points to that exact deployment.
- [ ] Verify production/preview environment variable names and scopes. Never expose secrets in client-side variables or logs.
- [ ] Run desktop/mobile browser acceptance for home, /investigate, /firstlight, /reports and /learn.
- [ ] Exercise FIRSTLIGHT case reset, evidence/tamper detection, findings, timeline, simulated approve/reject, audit validation and JSON/CSV import/export.
- [ ] Test malformed input, invalid timestamps, duplicate IDs, oversized uploads, repeated exports, loading states and error recovery.
- [ ] Test provider success, missing/invalid key, malformed response, timeout, rate limit and provider failure using authorized synthetic inputs only.
- [ ] Test URL scanner defenses for private/reserved addresses, metadata endpoints, redirects, credentials in URLs, HTTPS downgrade and response limits.
- [ ] Verify hosting-level egress controls, upload/request/concurrency limits and access controls for intended audience.
- [ ] Review CodeQL and dependency audit annotations, not only the green workflow status.
- [ ] Attach screenshots, logs and test outcomes; update docs/DEPLOYMENT_SIGNOFF.md only when each gate has evidence.

## Known boundary
SATARK is a prototype and triage aid, not a certified forensic product or antivirus. FIRSTLIGHT uses synthetic incident data and simulated response actions. Its session-based audit chain is not independently anchored chain-of-custody evidence.

Passing CI does not prove the deployed application is running the approved commit or that live provider flows work.
