"use client";

import {
  Bell,
  Boxes,
  Check,
  CircleDollarSign,
  CreditCard,
  FolderPlus,
  Gauge,
  Image as ImageIcon,
  Link2,
  Plus,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Asset,
  AuditEvent,
  Brand,
  Generation,
  ModelCapability,
  Project,
} from "@/domain/types";

export type ModalKind =
  | "upload"
  | "project"
  | "test-card"
  | "review"
  | "brand"
  | "credits"
  | "capabilities"
  | "notifications"
  | "settings"
  | "profile"
  | "folder"
  | "asset"
  | "job"
  | "camera";

type ModalPayload = {
  asset?: Asset;
  job?: Generation;
};

export function InteractionModal({
  kind,
  payload,
  project,
  brand,
  models,
  audits,
  onClose,
  onRefresh,
  onNotice,
  onCamera,
}: {
  kind: ModalKind;
  payload?: ModalPayload;
  project: Project;
  brand: Brand;
  models: ModelCapability[];
  audits: AuditEvent[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
  onNotice: (message: string) => void;
  onCamera?: (value: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewUrl, setReviewUrl] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  async function mutate(
    url: string,
    body: unknown,
    message: string,
    method = "POST",
  ) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-relayframe-organization": "org_demo",
        },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Action failed");
      await onRefresh();
      onNotice(message);
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error ? mutationError.message : "Action failed",
      );
    } finally {
      setBusy(false);
    }
  }

  function formValues(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    return new FormData(event.currentTarget);
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="interaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="interaction-modal-title"
      >
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={17} />
        </button>
        <ModalContent
          kind={kind}
          payload={payload}
          project={project}
          brand={brand}
          models={models}
          audits={audits}
          busy={busy}
          error={error}
          reviewUrl={reviewUrl}
          formValues={formValues}
          mutate={mutate}
          setReviewUrl={setReviewUrl}
          setBusy={setBusy}
          setError={setError}
          onClose={onClose}
          onNotice={onNotice}
          onCamera={onCamera}
        />
      </section>
    </div>
  );
}

function ModalContent({
  kind,
  payload,
  project,
  brand,
  models,
  audits,
  busy,
  error,
  reviewUrl,
  formValues,
  mutate,
  setReviewUrl,
  setBusy,
  setError,
  onClose,
  onNotice,
  onCamera,
}: {
  kind: ModalKind;
  payload?: ModalPayload;
  project: Project;
  brand: Brand;
  models: ModelCapability[];
  audits: AuditEvent[];
  busy: boolean;
  error: string | null;
  reviewUrl: string;
  formValues: (event: React.FormEvent<HTMLFormElement>) => FormData;
  mutate: (
    url: string,
    body: unknown,
    message: string,
    method?: string,
  ) => Promise<void>;
  setReviewUrl: (url: string) => void;
  setBusy: (value: boolean) => void;
  setError: (value: string | null) => void;
  onClose: () => void;
  onNotice: (message: string) => void;
  onCamera?: (value: string) => void;
}) {
  if (kind === "upload") {
    return (
      <>
        <ModalHeading icon={Upload} eyebrow="Asset intake" title="Import source media" description="Demo uploads create a validated asset record and deterministic preview. Production uses presigned quarantine storage." />
        <form
          onSubmit={(event) => {
            const data = formValues(event);
            void mutate(
              "/api/assets",
              {
                name: data.get("name"),
                type: data.get("type"),
                projectId: project.id,
              },
              "Asset imported",
            );
          }}
        >
          <label><span>Asset name</span><input name="name" required minLength={2} defaultValue="New product reference" /></label>
          <label><span>Media type</span><select name="type" defaultValue="reference"><option value="reference">Reference</option><option value="image">Image</option><option value="video">Video</option><option value="logo">Logo</option></select></label>
          <div className="modal-drop"><Upload size={22} /><b>Choose local file</b><small>Demo mode records metadata without transferring the original.</small><input type="file" aria-label="Choose source file" /></div>
          <ModalActions busy={busy} error={error} onClose={onClose} submit="Import asset" />
        </form>
      </>
    );
  }

  if (kind === "project") {
    return (
      <>
        <ModalHeading icon={FolderPlus} eyebrow="New workspace object" title="Create project" description="Start with an objective and cost ceiling. Brand context can be refined afterward." />
        <form
          onSubmit={(event) => {
            const data = formValues(event);
            void mutate(
              "/api/projects",
              {
                name: data.get("name"),
                objective: data.get("objective"),
                budgetCredits: Number(data.get("budget")),
              },
              "Project created",
            );
          }}
        >
          <label><span>Project name</span><input name="name" required minLength={3} placeholder="Fall performance sprint" /></label>
          <label><span>Creative objective</span><textarea name="objective" required minLength={10} rows={4} placeholder="Identify the strongest product demonstration for paid social." /></label>
          <label><span>Credit ceiling</span><input name="budget" type="number" min={25} max={100000} defaultValue={200} required /></label>
          <ModalActions busy={busy} error={error} onClose={onClose} submit="Create project" />
        </form>
      </>
    );
  }

  if (kind === "test-card") {
    return (
      <>
        <ModalHeading icon={Sparkles} eyebrow="Strategy matrix" title="Add Creative Test Card" description="Define one deliberate variable to test while holding campaign constants steady." />
        <form
          onSubmit={(event) => {
            const data = formValues(event);
            void mutate(
              "/api/test-cards",
              {
                projectId: project.id,
                strategy: data.get("strategy"),
                title: data.get("title"),
                hook: data.get("hook"),
              },
              "Test Card added",
            );
          }}
        >
          <label><span>Strategy</span><select name="strategy"><option value="problem_solution">Problem → solution</option><option value="demonstration">Demonstration</option><option value="objection">Objection handling</option><option value="social_proof">Social proof</option><option value="comparison">Comparison</option><option value="urgency">Offer urgency</option></select></label>
          <label><span>Concept title</span><input name="title" required minLength={3} placeholder="The afternoon reset" /></label>
          <label><span>Opening hook</span><textarea name="hook" required minLength={8} rows={3} placeholder="Your best workday does not need a third coffee." /></label>
          <ModalActions busy={busy} error={error} onClose={onClose} submit="Add Test Card" />
        </form>
      </>
    );
  }

  if (kind === "review") {
    async function createLink() {
      setBusy(true);
      setError(null);
      const response = await fetch(
        `/api/projects/${project.id}/review-link`,
        {
          method: "POST",
          headers: { "x-relayframe-organization": "org_demo" },
        },
      );
      const result = (await response.json()) as { url?: string; error?: string };
      setBusy(false);
      if (!response.ok || !result.url) {
        setError(result.error ?? "Could not create link");
        return;
      }
      setReviewUrl(`${location.origin}${result.url}`);
    }
    return (
      <>
        <ModalHeading icon={Link2} eyebrow="External approval" title="Share private review" description="Reviewers see only approved strategy and storyboard content—not prompts, cost, or workspace data." />
        {!reviewUrl ? (
          <div className="review-link-empty"><ShieldCheck size={22} /><p>A revocable, read-only review URL will be created for this project.</p><button className="modal-primary" type="button" disabled={busy} onClick={() => void createLink()}>{busy ? "Creating..." : "Create review link"}</button></div>
        ) : (
          <div className="review-link-ready"><Check size={22} /><b>Review link ready</b><div><input readOnly value={reviewUrl} /><button type="button" onClick={() => { void navigator.clipboard.writeText(reviewUrl); onNotice("Review link copied"); }}>Copy</button></div><a href={reviewUrl} target="_blank" rel="noreferrer">Open review page</a></div>
        )}
        {error && <p className="modal-error">{error}</p>}
      </>
    );
  }

  if (kind === "brand") {
    return (
      <>
        <ModalHeading icon={ShieldCheck} eyebrow={`Brand rules v${brand.version}`} title="Edit brand context" description="Saving creates a new version used by future generations. Existing lineage remains immutable." />
        <form
          onSubmit={(event) => {
            const data = formValues(event);
            void mutate(
              `/api/brands/${brand.id}`,
              {
                description: data.get("description"),
                tone: String(data.get("tone")).split(",").map((item) => item.trim()).filter(Boolean),
              },
              "Brand rules versioned",
              "PATCH",
            );
          }}
        >
          <label><span>Brand description</span><textarea name="description" rows={5} required minLength={20} defaultValue={brand.description} /></label>
          <label><span>Tone attributes, comma separated</span><input name="tone" required defaultValue={brand.tone.join(", ")} /></label>
          <ModalActions busy={busy} error={error} onClose={onClose} submit="Save new version" />
        </form>
      </>
    );
  }

  if (kind === "credits") {
    return (
      <>
        <ModalHeading icon={CircleDollarSign} eyebrow="Prepaid usage" title="Add credits" description="Demo checkout records an immutable purchase entry. Production delegates payment collection to Stripe." />
        <div className="credit-package-grid">
          {[250, 1000, 3000].map((amount) => (
            <button key={amount} type="button" disabled={busy} onClick={() => void mutate("/api/billing/top-up", { amount }, `${amount.toLocaleString()} credits added`)}>
              <ZapIcon /><b>{amount.toLocaleString()}</b><span>credits</span><small>{amount === 1000 ? "Most popular" : "Prepaid package"}</small>
            </button>
          ))}
        </div>
        {error && <p className="modal-error">{error}</p>}
      </>
    );
  }

  if (kind === "capabilities") {
    return (
      <>
        <ModalHeading icon={Boxes} eyebrow="Verified capability snapshot" title="Model registry" description="Product requests route by capability, policy, cost, and health—not hard-coded provider names." />
        <div className="capability-list">
          {models.map((model) => (
            <div key={model.id}><span className={`quality-dot quality-${model.qualityTier}`} /><span><b>{model.displayName}</b><small>{model.provider} · {model.operations.map((operation) => operation.replaceAll("_", " ")).join(", ")}</small></span><span><i /> Enabled</span></div>
          ))}
        </div>
      </>
    );
  }

  if (kind === "notifications") {
    return (
      <>
        <ModalHeading icon={Bell} eyebrow="Workspace events" title="Notifications" description="Recent auditable changes from your organization." />
        <div className="notification-list">
          {audits.length ? [...audits].reverse().slice(0, 8).map((audit) => (
            <div key={audit.id}><span><Bell size={14} /></span><p><b>{audit.action.replaceAll(".", " ")}</b><small>{audit.entityType} · {new Date(audit.createdAt).toLocaleTimeString()}</small></p></div>
          )) : <div className="modal-empty">No new notifications.</div>}
        </div>
      </>
    );
  }

  if (kind === "settings") {
    return (
      <>
        <ModalHeading icon={Gauge} eyebrow="Workspace controls" title="Settings" description="Local preferences apply immediately. Organization policy remains server-authoritative." />
        <div className="setting-list">
          <ToggleSetting title="Generation completion emails" detail="Receive a message when long-running jobs finish." />
          <ToggleSetting title="Budget warnings" detail="Warn at 70% and 90% of project credit ceilings." defaultChecked />
          <ToggleSetting title="Reduced media previews" detail="Load poster frames instead of autoplaying video." defaultChecked />
        </div>
        <button className="modal-primary full" type="button" onClick={() => { onNotice("Preferences saved locally"); onClose(); }}>Save preferences</button>
      </>
    );
  }

  if (kind === "profile") {
    return (
      <>
        <ModalHeading icon={User} eyebrow="Signed-in identity" title="Shourya Sharma" description="Workspace owner in the RelayFrame demo organization." />
        <div className="profile-detail"><span>SS</span><dl><div><dt>Email</dt><dd>demo@relayframe.local</dd></div><div><dt>Role</dt><dd>Owner</dd></div><div><dt>Authentication</dt><dd>Demo session</dd></div></dl></div>
        <button className="modal-secondary full" type="button" onClick={() => { onNotice("Production authentication requires OIDC configuration"); onClose(); }}>Manage account</button>
      </>
    );
  }

  if (kind === "folder") {
    return (
      <>
        <ModalHeading icon={FolderPlus} eyebrow="Library organization" title="Create folder" description="Folders are a presentation view over tags; assets retain stable IDs and lineage." />
        <form onSubmit={(event) => { const data = formValues(event); onNotice(`Folder “${data.get("name")}” created`); onClose(); }}><label><span>Folder name</span><input name="name" required minLength={2} placeholder="Approved launch assets" /></label><ModalActions busy={false} error={null} onClose={onClose} submit="Create folder" /></form>
      </>
    );
  }

  if (kind === "asset" && payload?.asset) {
    const asset = payload.asset;
    return (
      <>
        <ModalHeading icon={ImageIcon} eyebrow="Asset detail" title={asset.name} description="Private active media with generation and project lineage." />
        <div className="asset-modal-preview" style={{ backgroundImage: `url("${asset.url}")` }} />
        <dl className="detail-list"><div><dt>Type</dt><dd>{asset.type}</dd></div><div><dt>Dimensions</dt><dd>{asset.width} × {asset.height}</dd></div><div><dt>Status</dt><dd>{asset.status}</dd></div><div><dt>Generation</dt><dd>{asset.generationId ?? "Source upload"}</dd></div></dl>
        <a className="modal-primary full anchor-button" href={asset.url} download>Download asset</a>
      </>
    );
  }

  if (kind === "job" && payload?.job) {
    const job = payload.job;
    return (
      <>
        <ModalHeading icon={Gauge} eyebrow="Generation execution" title={job.operation.replaceAll("_", " ")} description={job.prompt} />
        <div className="job-modal-progress"><span><i style={{ width: `${job.progress}%` }} /></span><b>{job.progress}%</b></div>
        <dl className="detail-list"><div><dt>State</dt><dd>{job.state.replaceAll("_", " ")}</dd></div><div><dt>Model</dt><dd>{job.modelId}</dd></div><div><dt>Reserved</dt><dd>{job.reservedCredits} credits</dd></div><div><dt>Settled</dt><dd>{job.consumedCredits || "Pending"}</dd></div></dl>
      </>
    );
  }

  if (kind === "camera") {
    const recipes = [
      ["35mm slow push-in", "35mm lens, slow controlled dolly-in, shallow depth of field"],
      ["Overhead product demo", "locked overhead camera, precise tabletop composition"],
      ["Handheld UGC", "subtle handheld phone camera, natural autofocus breathing"],
      ["Macro orbit", "85mm macro lens, gentle 20-degree product orbit"],
    ];
    return (
      <>
        <ModalHeading icon={WandSparkles} eyebrow="Provider-neutral recipe" title="Choose camera direction" description="RelayFrame compiles this intent into model-specific parameters." />
        <div className="recipe-list">{recipes.map(([name, value]) => <button key={name} type="button" onClick={() => { onCamera?.(value); onNotice(`${name} applied`); onClose(); }}><ApertureIcon /><span><b>{name}</b><small>{value}</small></span><Plus size={14} /></button>)}</div>
      </>
    );
  }

  return null;
}

function ModalHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: typeof Upload;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="modal-heading">
      <span><Icon size={19} /></span>
      <div><p>{eyebrow}</p><h2 id="interaction-modal-title">{title}</h2><small>{description}</small></div>
    </header>
  );
}

function ModalActions({
  busy,
  error,
  onClose,
  submit,
}: {
  busy: boolean;
  error: string | null;
  onClose: () => void;
  submit: string;
}) {
  return (
    <>
      {error && <p className="modal-error">{error}</p>}
      <div className="modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="modal-primary" type="submit" disabled={busy}>{busy ? "Working..." : submit}</button></div>
    </>
  );
}

function ToggleSetting({
  title,
  detail,
  defaultChecked = false,
}: {
  title: string;
  detail: string;
  defaultChecked?: boolean;
}) {
  return <label className="toggle-setting"><span><b>{title}</b><small>{detail}</small></span><input type="checkbox" defaultChecked={defaultChecked} /><i /></label>;
}

function ZapIcon() {
  return <CircleDollarSign size={18} />;
}

function ApertureIcon() {
  return <WandSparkles size={17} />;
}
