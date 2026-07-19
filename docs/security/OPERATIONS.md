# Security Operations Runbook

## Severity

- **SEV-0:** active compromise, cross-tenant disclosure, signing/payment/provider
  key theft. Acknowledge within 10 minutes; target containment within 30 minutes.
- **SEV-1:** material outage or suspected limited breach. Acknowledge within 30
  minutes; target containment within four hours.
- **SEV-2/3:** tracked remediation under the vulnerability SLA.

## Universal incident procedure

1. Declare severity, incident commander, communications lead, and evidence lead.
2. Preserve logs, traces, audit events, affected artifact digests, and relevant
   provider/webhook envelopes.
3. Contain using feature flags, provider kill switches, session revocation,
   credential rotation, egress blocks, or deployment rollback.
4. Identify affected tenants, assets, jobs, time range, and data classes.
5. Eliminate access and verify containment with independent telemetry.
6. Recover from a known-good signed artifact.
7. Notify customers, providers, insurers, legal counsel, and regulators when
   contractual or legal thresholds apply.
8. Complete a blameless review with owners and deadlines.

Never delete evidence, communicate speculation as fact, or rotate credentials
before preserving the information required to determine impact.

## Provider compromise

1. Disable the provider/model for new routing.
2. Pause and quarantine in-flight/recent outputs.
3. Revoke API and webhook credentials.
4. Block provider domains at worker egress if active exploitation is possible.
5. Query lineage for every affected attempt, prompt, source, output, and tenant.
6. Re-run independent output moderation.
7. Route to a fallback only when capability, policy, cost, and customer terms
   remain compatible.
8. Rotate adjacent credentials and verify provider-side revocation.

## Credential exposure

1. Treat a committed or logged credential as compromised.
2. Revoke first; do not merely delete it from the latest commit.
3. Search repository history, CI logs, artifacts, chat, monitoring, support
   tools, and deployed configuration.
4. Issue a replacement with minimum scope.
5. Review usage from the first possible exposure until revocation.
6. Rotate derived secrets and invalidate affected sessions.

Maintain a secret inventory with owner, purpose, environment, scope, storage,
last rotation, expiry, and revocation procedure. Static provider/payment keys
must rotate at least every 90 days; KMS roots at least annually.

## Cross-tenant access

1. Disable the affected endpoint and revoke active sessions.
2. Preserve request IDs, session IDs, actor, tenant context, queries, and object
   access logs.
3. Test whether the issue bypassed only the application or also database RLS.
4. Identify every accessed/modified object and recipient.
5. Patch application authorization and database policy independently.
6. Add a regression test that intentionally omits the application filter.

## Billing or ledger anomaly

1. Disable new paid generations and credit grants.
2. Preserve Stripe events, provider invoices, reservations, attempts, and
   idempotency records.
3. Reconstruct balances from immutable entries.
4. Quarantine mismatched settlements rather than mutating history.
5. Resume only after conservation invariants and invoice reconciliation pass.

## Backup and restore

Production targets:

- PostgreSQL encrypted PITR: RPO ≤15 minutes, RTO ≤4 hours.
- Daily snapshot retention: 35 days.
- Object storage: versioning, encryption, lifecycle policy, separately
  protected recovery copy.
- Redis: reconstructable queue/cache, never the financial source of truth.
- Quarterly isolated restore exercise.

After restoring an older backup, replay the deletion tombstone ledger so erased
customer data does not reappear.

## Retention baseline

- Active customer projects/media: customer-controlled.
- Soft-delete recovery: 7 days.
- Confirmed active-system deletion: within 30 days.
- Application logs: 30 days.
- Security/audit events: 365 days with minimized identifiers.
- Backups: 35 days.
- Billing/tax records: applicable legal requirement.
- Review links: 7-day default expiry.

Provider retention and training use must be recorded per capability snapshot.
Deletion requests must propagate to subprocessors.

## Alerts

Page on:

- Cross-tenant authorization canary failure
- Session verification failure surge
- Sustained 401/403/429 anomaly
- Ledger imbalance, duplicate settlement, or negative balance
- Provider cost/egress spike
- Queue age or stuck jobs
- Stripe webhook signature/replay failures
- Moderation bypass or unsafe publication
- Backup/restore failure
- Secret-scanning alert
- Deletion deadline breach

All alerts require an owner, runbook link, severity, and tested escalation path.
