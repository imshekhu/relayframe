# RelayFrame Security Policy

RelayFrame is currently a demo-stage product. Do not deploy it with real
customer media, payment credentials, or paid model-provider keys until every
item in the production launch gate below is complete.

## Reporting a vulnerability

Do not open a public GitHub issue for a suspected vulnerability.

Contact the repository owner privately with:

- Affected commit and environment
- Reproduction steps
- Security impact
- Any proof-of-concept requests or payloads
- Suggested remediation, if available

Do not access data that is not yours, persist access, degrade service, perform
social engineering, or incur provider costs while testing.

## Supported version

Only the latest commit on `main` is supported after it has passed required
security and quality checks.

## Security invariants

- Tenant identity is derived from a verified server-side session.
- Client-provided organization headers are never authorization.
- Production fails closed when authentication or secrets are missing.
- Every mutation is role-authorized and same-origin protected.
- No provider submission occurs without a server-owned credit reservation.
- Financial events are append-only and idempotent.
- Customer media remains private and tenant-scoped.
- Uploads and provider outputs remain quarantined until validated and moderated.
- Provider URLs are untrusted and must pass SSRF-safe retrieval.
- Review links are random, hashed, expiring, scoped, revocable capabilities.
- Secrets never enter browser bundles, logs, source control, or analytics.
- Audit events never contain raw prompts, media, credentials, or payment data.

## Vulnerability remediation targets

| Severity | Target |
| --- | --- |
| Known exploited / credential exposure | Mitigate within 24 hours |
| Critical | 72 hours |
| High | 14 days |
| Medium | 60 days |
| Low | 90 days |

Exceptions require a named owner, compensating controls, documented approval,
and an expiry no longer than 30 days.

## Production launch gate

Do not accept paid users until:

- OIDC authentication, MFA for privileged access, and membership authorization
  are active.
- Cross-tenant API and PostgreSQL RLS tests pass.
- Stripe webhook signatures, replay protection, and reconciliation are live.
- Upload quarantine, malware scanning, MIME verification, media re-encoding,
  and private object delivery are live.
- Provider callbacks and downloads are signature-checked and SSRF-isolated.
- Input/output moderation and consent workflows are enforced.
- Production secrets use a managed secret manager and emergency rotation is
  tested.
- A production image is scanned, signed/attested, and deployed by digest using
  short-lived workload identity.
- Audit events reach a separate append-only sink.
- PostgreSQL PITR and object-storage restore tests have succeeded.
- Retention, deletion, and provider-deletion propagation have been verified.
- An external penetration test has no unresolved launch-blocking finding.

## Demo mode

`RELAYFRAME_DEMO_MODE=true` enables a shared local demonstration workspace. It
must never be enabled in a public production deployment. Demo billing and output
routes are simulations and are intentionally unavailable in normal production.
