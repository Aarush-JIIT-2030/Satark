# FIRSTLIGHT implementation status

Last reviewed: 2026-10-19

This status describes repository-backed behavior, not planned features or unverified live integrations.

## Implemented in the prototype

- Synthetic account-compromise training case with fictional indicators.
- SHA-256 sealing and verification of normalized evidence records.
- Interactive integrity/tamper challenge that flags changes against the stored digest.
- The Next.js FIRSTLIGHT workspace quarantines records with a detected hash mismatch from local findings and finding references; regression tests cover tampered-only, mixed, and trusted evidence.
- Deterministic detection and correlation rules with evidence-linked findings.
- Timestamp-based timeline reconstruction for supplied events.
- Explicit evidence gaps and uncertainty labels.
- Human approval/rejection of response proposals in simulation only.
- Session-local hash-chained audit events and JSON report export.
- JSON/CSV event import with validation and artifact hashing.
- Evidence triage ranking by volatility, text relevance, timestamp recency and integrity status (deterministic heuristic; not a calibrated risk score).
- A versioned investigation result (`schema_version: 1.1`) with a six-stage, evidence-grounded execution trace: integrity, triage, detection/correlation, timeline reconstruction, verification/gaps, and response planning. Each stage reports deterministic mode, input/output counts, and only evidence IDs from the current case. The Streamlit UI now displays this trace.
- Explicit orchestration metadata states that model-driven independent agents are not enabled; the trace is an honest deterministic multi-stage baseline, not a claim of autonomous LLM collaboration.

## Partially implemented

| Capability | Current state | What is still missing |
|---|---|---|
| Multi-agent investigation | Six bounded deterministic stages now expose a versioned trace with case-specific input/output counts and evidence references; UI labels the stages accurately. | Independent model agents, schema-validated tool calls, shared run state, retry policy, per-agent evaluation, and bounded tool permissions. |
| Suspicious activity detection | A small set of explainable rules and keyword checks; results link to evidence IDs. | Broader coverage, rule evaluation on validated live telemetry, test corpus, false-positive/negative evaluation and rule/version management. |
| Evidence prioritization | New transparent heuristic ranks supplied records and flags integrity mismatches for quarantine/review. | Domain-validated weights, analyst-configurable policy, source-specific volatility decay, prioritization metrics and UI parity in the Next.js workflow. |
| Timeline reconstruction | Sorts supplied timestamps and shows relationships/gaps. | Clock-skew handling, provenance/confidence per event, cross-source entity resolution and causal-relationship validation. |
| Evidence integrity | Hashes protect against accidental/after-sealing changes relative to a stored baseline. | Trusted collector identity, signed manifests, independently anchored hashes, trusted timestamps and durable chain of custody. |
| Case storage | A Supabase-backed evidence upload API and case-workspace components exist behind configuration/auth requirements. | End-to-end persisted FIRSTLIGHT case lifecycle, verified tenant policies, durable audit writes, retention and recovery tests. |
| Live response adapters | Opt-in Microsoft Defender device isolation and Entra session revocation adapters exist separately. | Safe integration into FIRSTLIGHT's authenticated approval workflow, real-tenant testing, durable approval/result records and recovery drills. |
| Frontend/backend parity | The Next.js FIRSTLIGHT UI and Python/Streamlit engine each have workflows. | A shared service contract so both surfaces execute the same investigation engine and return the same result schema. |

## Not implemented / not verified

- Live endpoint collector for active processes, connections, memory, and volatile system state.
- Autonomous LLM agents that independently plan and call investigation tools.
- Real-time ingestion or streaming telemetry pipeline.
- Production-grade forensic chain of custody or independently immutable audit anchoring.
- A fully connected persistent case lifecycle across create/import/investigate/approve/export.
- Live response initiated from FIRSTLIGHT's own approval interface.
- Firewall/network appliance blocking.
- Verified integration against a dedicated Microsoft test tenant.
- Production readiness or forensic certification.

## Recommended implementation order

1. **Shared investigation service contract:** define one versioned input/output schema and connect both UIs to the same engine/service.
2. **Persistent case and audit lifecycle:** authenticated case ownership, tenant-scoped access, durable event writes, protected manifests and retention.
3. **Agent orchestration:** add bounded, auditable tool calls only after service contracts and persistence are stable; keep deterministic rules as a fallback and require human review for consequential actions.
4. **Telemetry collector:** build an opt-in, least-privilege collector with signed collection manifests, strict egress controls and a disposable test environment.
5. **Live-response integration:** connect existing adapters only after approvals, durable audit, tenant authorization, rollback and integration tests are in place.
6. **Validation and release:** fix failing CI checks, run desktop/mobile smoke tests, verify the exact deployed SHA and document a controlled demo checklist.

## Safety and interpretation notes

- The current priority score is a deterministic triage hint, not a probability or claim of maliciousness.
- A hash mismatch raises review urgency; it does not prove who changed the record or make the record safe to use.
- All response actions in the FIRSTLIGHT prototype remain simulated unless a separate, explicitly enabled integration is configured. Do not present them as live actions without a verified test record.
