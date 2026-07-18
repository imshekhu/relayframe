# RelayFrame

An AI-native creative testing workspace for performance-marketing teams.

RelayFrame turns a campaign brief into structured creative hypotheses, generates
low-cost storyboards before expensive production, preserves complete media
lineage, and connects exported assets to campaign results.

This repository contains the first production-oriented vertical slice:

- Organization-scoped SaaS workspace
- Versioned brand system and claims guardrails
- Campaign projects and Creative Test Cards
- Storyboard approval workflow
- Provider-neutral image/video generation API
- Deterministic local demo provider
- Durable generation state model
- Immutable credit reservation and settlement ledger
- Asset library with parent/generation lineage
- Worker and provider adapter boundaries
- PostgreSQL/Drizzle production schema
- Redis/BullMQ worker foundation
- Local Postgres, Redis, and MinIO stack
- Responsive, accessible SaaS interface

## Product surfaces

- Overview and creative copilot
- Multi-model generation studio
- Project strategy and Test Card approval
- Storyboard pre-production gate
- Searchable asset library
- Generation job center
- Versioned brand system
- Usage and immutable credit ledger

## Local development

The default application uses a safe in-memory demo organization and simulated
provider, so the complete product flow works without external credentials.

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Generate an image concept in the Studio. The demo provider advances through the
same asynchronous job states as a real provider and produces deterministic local
media after several seconds.

## Production services

Start local PostgreSQL, Redis, and S3-compatible storage:

```sh
docker compose up -d
cp .env.example .env.local
npm run db:generate
npm run db:migrate
```

The demo store intentionally remains the active repository in this MVP. The
Drizzle schema and worker are the migration target for persistent deployments.

## Verification

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
npm audit
```

## Architecture

```text
Next.js web/control plane
├── domain state machines and ledger invariants
├── organization-scoped APIs
├── projects, creative strategy, assets and billing
└── provider-neutral generation contract

BullMQ execution plane
├── isolated provider adapters
├── polling/retry/cancellation
├── media processing boundary
└── moderation/publishing boundary

Data plane
├── PostgreSQL transactional state and ledger
├── Redis queue/rate control
└── S3-compatible originals and outputs
```

## Security and economics

- Provider credentials remain server-side.
- API requests are organization-scoped.
- Inputs are schema validated.
- Generation requires a pessimistic credit reservation.
- Settlement releases the reservation before consuming actual credits.
- Ledger entries are idempotent and append-only.
- Outputs are not considered published until post-processing and moderation.
- Security headers and private-by-default media architecture are included.
- No “unlimited generation” assumptions exist.

## Current limitations

- Authentication is represented by a fixed demo organization.
- External providers, Stripe, upload quarantine, email, and persistent queues
  require credentials and deployment configuration.
- Demo media is generated as local SVG artwork.
- Campaign result import and review links are represented in the domain and UI
  but are not yet connected to external ad platforms.

These boundaries are explicit so the prototype remains usable without implying
that production integrations are already configured.
