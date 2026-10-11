# FIRSTLIGHT live response integrations

## Scope

SATARK includes an opt-in Microsoft integration adapter for:
- Microsoft Defender for Endpoint device isolation.
- Microsoft Entra ID session revocation for a named user.

These are real tenant-side operations when configured with valid Microsoft app credentials and permissions. They are **not enabled by default**, are not wired to automatic AI decisions, and have not been live-tested against a tenant by this repository change. No credentials are included.

## Required server-side configuration

Set these only in the trusted server/host secret manager:
- `SATARK_ENABLE_LIVE_RESPONSE=true` (otherwise every action fails closed)
- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`

The app registration must be granted the least-privilege Microsoft API permissions and admin consent required by the target action. Defender device isolation requires the Microsoft Defender for Endpoint `Machine.Isolate` permission and an eligible device. Entra session revocation requires `User.RevokeSessions.All`. Review the current vendor documentation and your tenant's role/device-group policies before enabling.

Official references:
- https://learn.microsoft.com/en-us/defender-endpoint/api/isolate-machine
- https://learn.microsoft.com/en-us/graph/api/user-revokesigninsessions

## Human approval and safety controls

- Live response is disabled unless the explicit server-side feature flag is enabled.
- Every call requires an exact, action- and target-bound confirmation string.
- The operator must provide a target ID/UPN and a reason; no target is inferred from AI output.
- Requests have a finite timeout, redirects are rejected, provider response bodies are not surfaced to the UI, and target values are URL-encoded.
- The API response means the provider accepted/submitted the action, not that containment has completed. Verify the machine action or user session state in the vendor console.
- Never expose client secrets to browser code or commit them to the repository.
- Start with a dedicated test tenant and a disposable test endpoint/account. Keep a documented recovery/unisolation procedure and independent administrator access.

## What remains unimplemented

- No firewall/network appliance block action is implemented. Defender device isolation is endpoint containment, not a universal network firewall rule.
- No live action is triggered from FIRSTLIGHT's current simulated approval UI yet.
- No immutable external audit anchor, durable case store, or independently timestamped evidence manifest is implemented.
- No tenant has been connected or live action verified in this change.

Before presenting this as a live-response product, integrate these adapters into an authenticated operator workflow, store approvals and results in durable append-only storage, independently anchor audit manifests, add integration tests in a disposable tenant, and exercise rollback/unisolation.
