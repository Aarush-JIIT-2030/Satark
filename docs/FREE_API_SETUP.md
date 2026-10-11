# SATARK free-tier API setup

This project is intended to remain usable without paid API subscriptions. Free tiers have quotas and provider terms can change; verify your account dashboard before demo day.

## Recommended free credentials

### 1. GroqCloud — AI analysis already used by SATARK

- Sign in: https://console.groq.com/
- Create a key: https://console.groq.com/keys
- Add it to the backend/Streamlit host as `GROQ_API_KEY`.
- Do not use a `NEXT_PUBLIC_` variable or put the key in browser code.
- Free-tier model limits are per model and can change. Check https://console.groq.com/docs/rate-limits before choosing a model.
- Groq's free tier is suitable for development/testing subject to its current limits; paid Developer tier is usage billed.

### 2. AbuseIPDB — IP reputation lookups

- Register: https://www.abuseipdb.com/register
- Get the API key from Account → API Settings: https://www.abuseipdb.com/account/api
- Store server-side as `ABUSEIPDB_API_KEY`.
- Free individual accounts currently list 1,000 IP checks/reports per day. Do not submit reports automatically from AI findings; reporting is an external action and requires a human review.
- Docs and limits: https://www.abuseipdb.com/api and https://www.abuseipdb.com/pricing

### 3. URLhaus — malware URL intelligence

- Create an abuse.ch account and request the free Auth-Key: https://auth.abuse.ch/
- Store server-side as `URLHAUS_AUTH_KEY`.
- Use it for URLhaus-supported malware URL lookups/feeds. Follow its fair-use rules and do not treat a missing match as proof a URL is safe.
- Docs: https://urlhaus.abuse.ch/api/

## Do not assume these are free production response APIs

### Microsoft Defender for Endpoint / Entra ID

The adapter in this branch is optional and off by default. A Microsoft app registration may not cost money by itself, but the ability to isolate a device depends on an eligible Defender for Endpoint Plan 1, Plan 2 or Defender for Business deployment, device enrollment, permissions and tenant configuration. Entra session revocation requires an organizational tenant and admin-consented permissions; personal Microsoft accounts are not supported for this operation. Do not enable these adapters unless you already have authorized, eligible tenant resources. Official docs:
- https://learn.microsoft.com/en-us/defender-endpoint/api/isolate-machine
- https://learn.microsoft.com/en-us/graph/api/user-revokesigninsessions?view=graph-rest-1.0

There is no generic free API key that can safely isolate arbitrary computers, revoke arbitrary users' sessions, or block arbitrary networks.

## Free-only hackathon plan

1. Keep deterministic FIRSTLIGHT scenario and simulated response controls working without any API key.
2. Use Groq for optional AI explanation within the current free quota.
3. URL analysis now has an explicit opt-in enrichment checkbox. When enabled, SATARK queries URLhaus for the submitted HTTP(S) URL and checks public IPv4 literals in that URL with AbuseIPDB. Lookups have finite timeouts, rate-limit/credential error handling, provider attribution and graceful per-provider fallback. Domain names are not resolved for AbuseIPDB, so a normal hostname may produce a URLhaus result but no AbuseIPDB IP result.
4. For a real containment demo at zero licensing cost, use an isolated local lab with open-source tooling such as Wazuh and disposable virtual machines. Do not expose a privileged agent or control API to the public internet. Actual endpoint isolation still requires an agent/integration running on the endpoint and explicit operator authorization.
5. Keep `SATARK_ENABLE_LIVE_RESPONSE=false` unless a dedicated, authorized test lab is configured. Never enter real API keys in GitHub issues, chat, source code, or frontend environment variables.

## Enable threat-intelligence lookups in the app

Open **Investigate → URL**, enter a URL, and tick **Check with configured threat-intelligence providers** before analysis. This is off by default because the submitted URL may be shared with URLhaus and a public IPv4 literal may be shared with AbuseIPDB. Keys are read from server-side environment variables or Streamlit secrets. If either key is missing or a provider is unavailable, SATARK reports that provider's status without failing the main analysis. A no-match result is not a safety verdict.

## Environment variable checklist

```dotenv
GROQ_API_KEY=
ABUSEIPDB_API_KEY=
URLHAUS_AUTH_KEY=
SATARK_ENABLE_LIVE_RESPONSE=false
# Only set Microsoft values if an authorized eligible tenant exists:
MICROSOFT_TENANT_ID=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

Use only server-side secrets for all keys. Never commit a populated env file.
