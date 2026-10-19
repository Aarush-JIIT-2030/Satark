# Agentic investigation workflow for SATARK / FIRSTLIGHT

**Status:** design proposal for incremental implementation  
**Scope:** adapt useful agent-engineering patterns to SATARK's security-investigation workflow; do not transplant a tutorial framework wholesale.

## Why this belongs in SATARK

SATARK is not a general-purpose chatbot. Its useful job is to help a reviewer move from suspicious artifacts and incident events to an evidence-backed, reviewable decision. The agent should therefore be **bounded, traceable, and subordinate to the evidence**.

The reference repository, [GenAI_Agents by Nir Diamant](https://github.com/NirDiamant/GenAI_Agents), is a teaching collection covering agent control flow, tools, memory, orchestration, and evaluation. This document adapts those general engineering ideas to SATARK. It does **not** copy notebooks, source code, prompts, images, or other repository assets. No framework or dependency is required by this design document.

## Proposed investigation flow

```text
Incident / artifact input
        |
        v
1. Validate + normalize input
        |
        v
2. Build evidence register (stable IDs, hashes where supported, timestamps, source)
        |
        v
3. Run deterministic checks and existing SATARK analysis
        |
        v
4. Optional model-assisted interpretation of the bounded evidence
        |
        v
5. Correlate findings + identify missing evidence / contradictions
        |
        v
6. Human review: approve, reject, or request more evidence
        |
        v
7. Record decision + export a report
```

The model may explain evidence, but it must not invent evidence, silently change deterministic results, or trigger a consequential response action by itself.

## Design rules

### 1. Use a small, explicit state machine

Prefer a single orchestrated workflow over a swarm of agents for the first implementation. Each step should have a named input and output and a clear failure state.

Suggested states:

- `RECEIVED`
- `VALIDATED`
- `ANALYZED`
- `CORRELATED`
- `AWAITING_REVIEW`
- `APPROVED` or `REJECTED`
- `COMPLETED` or `NEEDS_MANUAL_REVIEW`

Transitions must be explicit. A failed model call should lead to deterministic-only results or manual review, not an unhandled crash or a fabricated conclusion.

### 2. Keep tools narrow and allow-listed

Expose existing, tested SATARK functions as tools only when they have a clear contract. A tool definition should include:

- a stable name and short purpose;
- validated input schema and strict size/time limits;
- structured output with evidence references;
- bounded execution and a predictable error result;
- a test that verifies its behavior.

Do not give the model arbitrary shell access, unrestricted URL fetching, repository write access, or credentials. Reuse SATARK's existing input-validation and URL-safety boundaries; do not create a second, weaker path around them.

### 3. Treat evidence and model interpretation as different data

Each finding should distinguish:

- **Observation:** what the parser, log, or deterministic check actually returned;
- **Interpretation:** what the model or rule suggests it may mean;
- **Confidence / uncertainty:** how strong the available support is;
- **Evidence references:** IDs for the artifacts or events supporting the finding;
- **Gap / next check:** what is missing or would corroborate the interpretation.

A model-generated claim without a valid evidence reference should be marked as unverified or excluded from the final finding. Confidence must not be inflated merely because the model sounds certain.

### 4. Keep human approval as a hard boundary

The model can recommend a next step, but the workflow must not execute a real account, identity, endpoint, or tenant response action without explicit human approval tied to the exact target and action. Approval should expire if the target or action changes. Rejection must be a valid terminal decision, not an error.

The current synthetic FIRSTLIGHT scenario should remain safe to demonstrate without live credentials. Any future real-response adapter needs separate opt-in configuration, target-bound authorization, audit logging, and integration tests before it is described as connected.

### 5. Use case-scoped memory, not open-ended memory

For the initial version, keep workflow state and evidence inside the current investigation/session. If persistent case memory is added later, store only explicitly selected, necessary facts with provenance and retention rules. Never silently mix evidence from two different incidents or use a previous model answer as if it were verified evidence.

### 6. Trace each run and decision

Record a structured trace for each stage:

- run/case ID and workflow version;
- step name, start/end time, status, and bounded error code;
- tool name and sanitized input/output summaries;
- evidence IDs referenced by each finding;
- model/provider and model identifier when used;
- human decision, action, and timestamp.

Do not log raw secrets, API keys, full uploaded documents, or unnecessary personal data. Trace storage must respect SATARK's current session/privacy model until a reviewed persistence design exists.

### 7. Evaluate the workflow, not just the model's prose

Build a small, versioned synthetic test set before adding more autonomy. Include at least:

- clearly suspicious and benign examples;
- ambiguous / insufficient-evidence cases;
- conflicting indicators;
- malformed or oversized input;
- unavailable model/provider;
- missing evidence reference;
- human rejection and approval-target mismatch.

Measure deterministic regression results, evidence-reference validity, correct abstention/manual-review behavior, unsafe-action prevention, latency, and failure handling. A passing LLM response alone is not sufficient evidence that the investigation workflow works.

## Incremental implementation plan

### Phase 1 — Contracts and tests

- Map the existing FIRSTLIGHT engine, SATARK analysis functions, and current UI/backend boundaries.
- Define typed schemas for evidence, findings, workflow state, and review decisions.
- Add unit tests for state transitions, invalid inputs, and fail-closed behavior.
- Keep existing deterministic behavior as the baseline.

### Phase 2 — Orchestration

- Add one small orchestrator around existing functions; do not duplicate the analysis engine.
- Run deterministic checks first and call the optional model only for bounded interpretation.
- Validate model output against a schema and verify every referenced evidence ID.
- Return a structured manual-review result when output is invalid or the provider is unavailable.

### Phase 3 — Review and trace UI

- Show observations separately from AI interpretation.
- Let a reviewer inspect evidence references, uncertainty, contradictions, and missing evidence.
- Make approve/reject decisions explicit and tied to the current action target.
- Add a compact per-run trace without exposing secrets or raw sensitive content.

### Phase 4 — Regression evaluation

- Run the synthetic evaluation suite in CI.
- Add a browser smoke test for the principal FIRSTLIGHT flow if the existing web workspace supports it.
- Document which features are deterministic, model-assisted, simulated, or genuinely connected to an external system.

## Acceptance criteria

The first implementation is ready only when:

- [ ] A complete investigation can finish without a model/provider being available.
- [ ] Model output is schema-validated and cannot create evidence records by itself.
- [ ] Every displayed finding points to existing evidence IDs or is explicitly labelled unverified.
- [ ] Invalid input, tool errors, timeouts, and model failures produce a safe, reviewable result.
- [ ] No real response action can run solely because the model recommended it.
- [ ] Approval is bound to the exact action and target; a changed target requires a new decision.
- [ ] Tests cover successful, ambiguous, malformed, failure, and rejection paths.
- [ ] The README accurately labels demo/simulated integrations versus live integrations.

## Scope deliberately excluded for now

- Multi-agent debate or self-improving agents without a measurable need;
- unrestricted web search or arbitrary tool execution;
- automatic remediation or live tenant actions;
- cross-case persistent memory;
- adding LangChain/LangGraph or another orchestration dependency before the existing code paths and deployment constraints are mapped.

These may be evaluated later if a specific SATARK requirement justifies their cost and risk.

## Reference

- Nir Diamant, [GenAI_Agents](https://github.com/NirDiamant/GenAI_Agents) — general learning reference for agent control flow, tools, memory, orchestration, and evaluation. This SATARK design is an original, project-specific adaptation and does not include copied code or assets.
