# SATARK security-tool parity and restoration matrix

Baseline reviewed: main at 265dae7f97d7a6c1fde342db93e76dd0ccd6eedf (2026-10-14).
This is a current-state inventory and acceptance plan, not a claim that every gate has passed.

## Status vocabulary

- Legacy implemented: code exists in the Python/Streamlit app; this does not imply current web availability.
- Web partial: some web-facing functionality exists, but the original workflow is not equivalent.
- Blocked: a known production dependency prevents the route from completing.
- Unverified: implementation exists but the complete live acceptance journey has not been demonstrated.
- Not migrated: the current Next.js workspace does not expose a complete equivalent.

## Feature parity matrix

| Capability | Legacy implementation | Next.js implementation at baseline | Work required | Acceptance proof |
|---|---|---|---|---|
| Text/message triage | satark.py, analysis_engine.py, ai_provider.py, evidence_engine.py | /investigate + /api/analyze; deterministic local checks and optional Ollama | Fix shared limiter configuration; test truthful result states and model fallback | Synthetic malicious/benign/ambiguous cases return valid explainable results; dependency failure never appears safe |
| URL inspection | url_security.py validates public destinations, pins IPs, limits redirects/bytes and extracts visible text | URL can be entered as text; full legacy fetch/inspect journey not established | Add isolated server-side inspection or intentionally retain non-fetching mode and label it clearly; preserve SSRF controls | Redirect, DNS rebinding, private IP, credentials, nonstandard ports, oversized body and timeout tests |
| Image threat analysis | input_processing.py + vision-capable provider in satark.py | /image-review does local metadata/hash inspection only | Add separate visual threat-analysis flow and configured provider/local-model path | File-limit, provider-down, output-grounding and uncertainty tests |
| QR code | Original image workflow documents QR inspection | Not migrated | Decode in browser or isolated worker; inspect decoded payload as text; route URL payload through safe inspection | Show decoded value before action; malicious QR fixtures, corrupt QR and non-URL payload tests |
| PDF/document | input_processing.py bounded PDF extraction: 25 MB, up to 30 pages, 50k characters | No complete document-analysis flow | Add safe extraction service with byte/page/time limits and explicit scanned/encrypted/unsupported states | Corrupt, encrypted, scanned, oversized and prompt-injection document tests |
| Video | video_processing.py samples up to two frames; optional FFmpeg/faster-whisper audio path | Not migrated | Add bounded processing through a suitable isolated worker; disclose sampling and transcription state | Corrupt codec, size limit, missing dependency, timeout, frames-only and transcript tests |
| Threat intelligence | threat_intel.py, verification UI and local IOC import script | Local IOC-cache support; checked-in cache intentionally empty | Add provenance/freshness/source visibility; import approved feed and verify license | Match/no-match/stale/unavailable/not-requested fixtures |
| Deterministic signal ledger | evidence_engine.py, findings.py, satark_utils.py | Some deterministic signals in local analysis API | Define shared typed signal schema and preserve provenance/source spans | Unit tests show each signal references observable input and avoids unsupported certainty |
| Evidence and timeline | FIRSTLIGHT engines and ingestion modules | /firstlight training flow plus persistence APIs | Connect scanner outputs to stable case evidence IDs; reconcile timestamps/hashes after reload | Fresh-session case lifecycle and refresh/retry/duplicate-write tests |
| Image metadata/integrity | Related preprocessing helpers | /image-review browser-side inspection and SHA-256 | Keep as a distinct utility and test resource bounds/file handling | Known fixture hashes, malformed image and dimension tests |
| Case persistence | Legacy history is session-oriented | Supabase case/evidence/finding/report APIs | Run two-tenant isolation and end-to-end persistence tests | User A cannot read/write/export/verify user B records; saved case survives refresh |
| Reports | reports.py and legacy PDF output | Local TXT/JSON and persistent-report components; full PDF journey not established | Produce case-linked PDF/JSON/CSV with hashes, timestamps, methods, sources and limitations | Export reconciles with saved records and refuses cross-tenant access |
| Learning | scam_challenge.py and ui/learning.py | /learn educational UI | Preserve content; label visual OTP demo as non-authentication | Quiz/reset/keyboard tests; no OTP success presented as identity verification |
| Real response actions | Optional integrations/response_actions.py adapters | FIRSTLIGHT controls are simulated | Keep real actions disabled until explicit target-bound authorization and safe integration tests | Simulation causes no real action; adapter tests use mocks/non-destructive targets only |

## Required architecture

1. Keep Next.js as the primary user experience.
2. Treat media processing as an explicit server-side service boundary. Do not put heavy parsers/codecs in Vercel request handlers without proving runtime, memory, timeout and isolation constraints.
3. Prefer a private worker for PDF/video parsing if deployment limits are insufficient. The web app should submit bounded jobs, show processing state and retrieve results using authenticated case-scoped IDs.
4. Define one versioned result schema across text, URL, image, QR, PDF and video. Keep observations, IOC matches, model interpretations, analyst conclusions and actions separate.
5. Never execute uploaded files. Treat decoded QR content and document text as untrusted, including prompt-injection instructions.
6. Disclose when content is sent to a configured model/provider; do not store original source content in browser storage; make external lookups explicit.
7. Expose truthful states: not requested, disabled, unavailable, no match, match and insufficient evidence. None of the first four means safe.
8. Attach scanner results to persistent cases using stable evidence IDs, hashes, method/version, timestamps, source provenance and limitations.

## Execution sequence

### P0 — production gate
- [ ] Configure and verify shared Upstash rate limiting in Vercel; redeploy and confirm POST /api/analyze returns 200 for authorized synthetic tests.
- [ ] Verify production version endpoint equals the intended commit.
- [ ] Complete two-tenant authorization, evidence upload/verification, report and audit-chain integration tests.
- [ ] Ensure unavailable states never imply a clean result.

### P1 — feature restoration
- [ ] Create a common typed scanner contract and API error model.
- [ ] Restore image threat analysis separately from metadata review.
- [ ] Restore QR decoding and decoded-payload inspection.
- [ ] Restore bounded PDF extraction and analysis.
- [ ] Restore video frame sampling and optional audio transcription through a suitable isolated worker.
- [ ] Add URL inspection only with SSRF defenses and infrastructure egress restrictions.
- [ ] Populate IOC data only from an approved, license-compatible, provenance-tracked source.
- [ ] Link supported scan outputs to persistent cases and reports.

### P2 — usability and quality
- [ ] Show status, supported formats, limits, privacy handling and dependencies before upload.
- [ ] Provide per-file progress, cancel/retry, partial-success and actionable error states.
- [ ] Complete desktop/mobile visual QA, keyboard and screen-reader checks, reduced-motion and contrast checks.
- [ ] Test oversized, malformed, encrypted, polyglot and adversarial inputs.
- [ ] Test the full case journey in a real browser and across fresh sessions.

### P3 — operational sign-off
- [ ] Run CI, CodeQL, dependency/license checks, secret scan, DAST and focused security review on the exact release commit.
- [ ] Record deployed SHA, smoke-test output, environment dependency status, rollback target and known limitations.
- [ ] Publish privacy/retention, supported-format, operator and incident-response documentation.

## Definition of done

A feature is complete only when the UI is connected to the correct processing implementation, has resource and security limits, returns a validated result with provenance/limitations, handles errors truthfully, has automated tests, and passes a browser acceptance journey on the release commit.
