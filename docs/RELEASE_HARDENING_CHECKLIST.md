# SATARK release hardening checklist

Last reviewed: 2026-10-11. Checks below distinguish CI evidence from live deployment evidence.

## Automated checks
- [x] Frontend dependency lockfile is committed and `npm ci` succeeded on the reviewed PR commit.
- [x] Frontend TypeScript check and production build passed on the reviewed PR commit.
- [x] FIRSTLIGHT CSV parser regression tests passed (6 tests).
- [x] Existing Python unit tests and Streamlit browser smoke checks passed on the reviewed PR commit.
- [x] CodeQL passed on the reviewed PR commit.
- [x] Frontend `npm audit --audit-level=high` passed after overriding the vulnerable nested PostCSS dependency.
- [x] Next.js production build and automated desktop (1440px) / mobile (390px) route smoke tests passed on the reviewed PR commit.

## Runtime and deployment verification
- [x] Main routes were exercised at desktop and mobile sizes with horizontal-overflow checks in CI.
- [x] FIRSTLIGHT synthetic-case launch, findings/timeline navigation, and simulated response approval were exercised in CI.
- [x] API malformed-JSON and empty-input failure responses were exercised in CI.
- [ ] Live provider success test using a synthetic non-sensitive input: the CI test is conditional on a configured GitHub Actions `GROQ_API_KEY`; a live provider response has not been evidenced yet.
- [ ] Confirm the deployed secret's actual usability and model availability without revealing the secret.
- [ ] Verify the public deployment commit SHA matches the approved main commit.
- [ ] Verify the public site in a real browser after deployment.
- [ ] Confirm rollback owner and monitoring responsibility.

## Deployment blocker
The Vercel `satark` project was configured as Python while the app is a Next.js app. Project framework/root/build settings were corrected to Next.js, `web`, `npm ci`, `npm run build`, Node 22. However, recent deployments for this project failed with `PYTHON_ENTRYPOINT_NOT_FOUND`, and a manual preview deployment request was rejected because the team's Vercel deployment API quota is exhausted (retry after 24 hours). A live deployment using the corrected configuration is therefore still unverified.

## Boundaries
FIRSTLIGHT is a synthetic training workspace. Its in-browser hashes are not an externally anchored chain of custody. The Groq route's in-memory rate limiter is best-effort and is not a shared/global abuse control. Do not represent these features as production forensic guarantees.

## Sign-off
Release status: **BLOCKED for production until a corrected Vercel deployment is ready and the remaining live-provider, public-browser, and operational sign-off checks are evidenced.** Post-merge GitHub Actions checks are also running for the merge commit.
