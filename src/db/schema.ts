import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const generationState = pgEnum("generation_state", [
  "created",
  "validating",
  "safety_precheck",
  "cost_reserved",
  "queued",
  "provider_running",
  "media_processing",
  "safety_postcheck",
  "publishing",
  "completed",
  "rejected",
  "failed",
  "cancelled",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    plan: text("plan").notNull().default("trial"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("organizations_slug_idx").on(table.slug)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("memberships_org_user_idx").on(
      table.organizationId,
      table.userId,
    ),
  ],
);

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description").notNull(),
  rules: jsonb("rules").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  brandId: uuid("brand_id").references(() => brands.id),
  name: text("name").notNull(),
  objective: text("objective").notNull(),
  state: text("state").notNull(),
  budgetCredits: integer("budget_credits").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id),
  parentAssetId: uuid("parent_asset_id"),
  type: text("type").notNull(),
  name: text("name").notNull(),
  objectKey: text("object_key").notNull(),
  sha256: text("sha256"),
  metadata: jsonb("metadata").notNull().default({}),
  status: text("status").notNull().default("quarantined"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const generations = pgTable(
  "generations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id),
    operation: text("operation").notNull(),
    state: generationState("state").notNull().default("created"),
    stateVersion: integer("state_version").notNull().default(0),
    prompt: text("prompt").notNull(),
    modelId: text("model_id").notNull(),
    capabilitySnapshot: jsonb("capability_snapshot").notNull(),
    parameters: jsonb("parameters").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    reservedCredits: integer("reserved_credits").notNull(),
    consumedCredits: integer("consumed_credits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("generation_org_idempotency_idx").on(
      table.organizationId,
      table.idempotencyKey,
    ),
  ],
);

export const generationAttempts = pgTable(
  "generation_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    generationId: uuid("generation_id")
      .notNull()
      .references(() => generations.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    provider: text("provider").notNull(),
    providerJobId: text("provider_job_id"),
    state: text("state").notNull(),
    estimatedCostMicroUsd: bigint("estimated_cost_micro_usd", {
      mode: "number",
    }).notNull(),
    actualCostMicroUsd: bigint("actual_cost_micro_usd", { mode: "number" }),
    errorCode: text("error_code"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("generation_attempt_ordinal_idx").on(
      table.generationId,
      table.attemptNumber,
    ),
  ],
);

export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    generationId: uuid("generation_id").references(() => generations.id),
    type: text("type").notNull(),
    amount: integer("amount").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("ledger_idempotency_idx").on(
      table.organizationId,
      table.idempotencyKey,
    ),
  ],
);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  actorId: text("actor_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: jsonb("metadata").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const modelCapabilities = pgTable("model_capabilities", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  displayName: text("display_name").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
});
