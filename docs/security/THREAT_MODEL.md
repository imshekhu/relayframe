# RelayFrame Threat Model

## Protected assets

- Identities, sessions, memberships, roles and invitations
- Prompts, briefs, brand claims, source media and generated media
- Credits, reservations, settlements, refunds and provider costs
- Provider, Stripe, database, Redis and storage credentials
- Review capabilities, audit evidence and moderation decisions
- Worker/provider availability and organization budgets

## Principal trust boundaries

```text
Browser → Next.js control plane
Anonymous reviewer → Review capability endpoint
Control plane → PostgreSQL
Control plane → Redis/BullMQ → Worker
Worker → AI providers
Browser → Quarantine storage → Scanner/transcoder → Private storage
Provider webhook/output URL → Isolated webhook/fetch boundary
Stripe webhook → Billing ledger
Support/admin tooling → Tenant data
```

## Principal attack objectives

### Unauthorized provider spend

- Forge identity or organization
- Mint credits without verified payment
- Race credit reservations
- Bypass project budgets
- Trigger duplicate provider jobs through retries
- Exhaust queue, rate, storage, or provider quota

### Cross-tenant disclosure

- Substitute object/organization IDs
- Exploit missing membership checks
- Create cross-tenant database references
- Guess or leak review capabilities
- Enumerate media
- Abuse support/admin access

### Unsafe publication

- Obfuscate prohibited intent
- Upload malicious or unauthorized identity media
- Inject instructions through prompts/metadata
- Compromise a provider output
- Bypass quarantine/post-generation moderation
- Supply active SVG/HTML/polyglot media

### SSRF and internal compromise

- Supply arbitrary media URL
- Influence provider-returned URL
- Redirect/rebind approved domains to private addresses
- Reach cloud metadata, internal storage or admin services

## Mandatory controls

- Server-derived identity, membership and roles
- Same-origin mutation policy and CSRF protection
- Tenant-aware rate, concurrency and spend limits
- Database RLS plus tenant-consistent foreign keys
- Transactional reservation/outbox before provider submission
- Stable provider idempotency token and bounded retries/deadlines
- Quarantine, MIME sniffing, malware scan and re-encoding
- Independent pre/post moderation and consent records
- Isolated SSRF-safe downloader with strict egress
- Verified/replay-protected Stripe and provider webhooks
- Random hashed expiring review capabilities
- Append-only audit and financial events
- Managed secrets, scoped worker identities and kill switches
- Retention/deletion enforcement and tested recovery

## Review cadence

Update this model when adding:

- Authentication or account recovery
- New provider/model capability
- File upload or URL ingestion
- Billing/webhooks
- Agents, MCP tools or prompt-triggered actions
- Admin/support impersonation
- Public review/collaboration
- New deployment region or storage processor

Every major feature PR must identify new assets, trust boundaries, attacker
actions, abuse costs, detection signals, and rollback/kill-switch behavior.
