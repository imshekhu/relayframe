-- Apply after the generated Drizzle migration in production.
-- Every transaction must first execute:
--   SET LOCAL app.current_organization_id = '<verified organization UUID>';
-- Never expose the database role used by the application to end users.

BEGIN;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_tenant_isolation ON organizations
  USING (
    id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY memberships_tenant_isolation ON memberships
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY brands_tenant_isolation ON brands
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY projects_tenant_isolation ON projects
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY assets_tenant_isolation ON assets
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY generations_tenant_isolation ON generations
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY generation_attempts_tenant_isolation ON generation_attempts
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY ledger_tenant_isolation ON ledger_entries
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY audit_tenant_read ON audit_events
  FOR SELECT
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY outbox_tenant_isolation ON outbox_events
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

CREATE POLICY review_links_tenant_isolation ON review_links
  USING (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  )
  WITH CHECK (
    organization_id =
    NULLIF(current_setting('app.current_organization_id', true), '')::uuid
  );

-- Defense against cross-tenant parent references.
ALTER TABLE brands
  ADD CONSTRAINT brands_organization_id_id_unique UNIQUE (organization_id, id);
ALTER TABLE projects
  ADD CONSTRAINT projects_organization_id_id_unique UNIQUE (organization_id, id);
ALTER TABLE generations
  ADD CONSTRAINT generations_organization_id_id_unique UNIQUE (organization_id, id);

ALTER TABLE projects
  ADD CONSTRAINT projects_brand_same_tenant
  FOREIGN KEY (organization_id, brand_id)
  REFERENCES brands (organization_id, id);

ALTER TABLE assets
  ADD CONSTRAINT assets_project_same_tenant
  FOREIGN KEY (organization_id, project_id)
  REFERENCES projects (organization_id, id);

ALTER TABLE generations
  ADD CONSTRAINT generations_project_same_tenant
  FOREIGN KEY (organization_id, project_id)
  REFERENCES projects (organization_id, id);

ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_generation_same_tenant
  FOREIGN KEY (organization_id, generation_id)
  REFERENCES generations (organization_id, id);

ALTER TABLE generation_attempts
  ADD CONSTRAINT attempts_generation_same_tenant
  FOREIGN KEY (organization_id, generation_id)
  REFERENCES generations (organization_id, id);

ALTER TABLE review_links
  ADD CONSTRAINT review_links_project_same_tenant
  FOREIGN KEY (organization_id, project_id)
  REFERENCES projects (organization_id, id);

ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_amount_positive CHECK (amount > 0);
ALTER TABLE generations
  ADD CONSTRAINT generation_credits_nonnegative
  CHECK (reserved_credits >= 0 AND consumed_credits >= 0);

COMMIT;
