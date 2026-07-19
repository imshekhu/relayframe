"use client";

import {
  Activity,
  Aperture,
  ArrowRight,
  BadgeCheck,
  Bell,
  Boxes,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Command,
  CreditCard,
  Film,
  FolderKanban,
  Gauge,
  Image as ImageIcon,
  Layers3,
  Library,
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import type {
  Asset,
  AuditEvent,
  Brand,
  CreativeBrief,
  Generation,
  LedgerEntry,
  ModelCapability,
  Organization,
  Project,
  StoryboardFrame,
  TestCard,
} from "@/domain/types";
import {
  InteractionModal,
  type ModalKind,
} from "@/components/interaction-modal";

type View =
  | "home"
  | "studio"
  | "projects"
  | "library"
  | "jobs"
  | "brand"
  | "billing";

type Snapshot = {
  snapshotAt: string;
  organization: Organization;
  brands: Brand[];
  projects: Project[];
  briefs: CreativeBrief[];
  testCards: TestCard[];
  storyboardFrames: StoryboardFrame[];
  assets: Asset[];
  generations: Generation[];
  ledger: LedgerEntry[];
  audits: AuditEvent[];
  availableCredits: number;
};

const nav = [
  { id: "studio" as const, label: "Create", icon: WandSparkles },
  { id: "projects" as const, label: "Projects", icon: FolderKanban },
  { id: "library" as const, label: "Library", icon: Library },
];

const secondaryNav = [
  { id: "home" as const, label: "Overview", icon: Gauge },
  { id: "jobs" as const, label: "Activity", icon: Activity },
  { id: "brand" as const, label: "Brand system", icon: Target },
  { id: "billing" as const, label: "Usage & billing", icon: CreditCard },
];

const strategyLabels: Record<TestCard["strategy"], string> = {
  problem_solution: "Problem → solution",
  demonstration: "Demonstration",
  objection: "Objection handling",
  social_proof: "Social proof",
  comparison: "Comparison",
  urgency: "Offer urgency",
};

const stateLabels: Record<Project["state"], string> = {
  draft: "Draft",
  strategy_review: "Strategy review",
  storyboard_review: "Storyboard review",
  production: "Production",
  client_review: "Client review",
  exported: "Exported",
  results_imported: "Results imported",
  archived: "Archived",
};

function relativeTime(value: string, reference: string) {
  const elapsed = new Date(reference).getTime() - new Date(value).getTime();
  if (elapsed < 60_000) return "Just now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return `${Math.floor(elapsed / 86_400_000)}d ago`;
}

function AssetArt({
  url,
  label,
  className = "",
}: {
  url: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`asset-art ${className}`}
      role="img"
      aria-label={label}
      style={{ backgroundImage: `url("${url}")` }}
    />
  );
}

function StatusDot({ state }: { state: Generation["state"] }) {
  return (
    <span className={`status-chip status-${state}`}>
      <i />
      {state.replaceAll("_", " ")}
    </span>
  );
}

export function RelayFrameApp({
  initialSnapshot,
  models,
}: {
  initialSnapshot: Snapshot;
  models: ModelCapability[];
}) {
  const [view, setView] = useState<View>("studio");
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [studioSeed, setStudioSeed] = useState("");
  const [modal, setModal] = useState<{
    kind: ModalKind;
    asset?: Asset;
    job?: Generation;
  } | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/demo", {
      headers: { "x-relayframe-organization": "org_demo" },
      cache: "no-store",
    });
    if (response.ok) setSnapshot((await response.json()) as Snapshot);
  }, []);

  useEffect(() => {
    const running = snapshot.generations.some(
      (generation) =>
        !["completed", "failed", "rejected", "cancelled"].includes(
          generation.state,
        ),
    );
    if (!running) return;
    const timer = window.setInterval(refresh, 1_000);
    return () => window.clearInterval(timer);
  }, [refresh, snapshot.generations]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6_000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, []);

  const activeProject = snapshot.projects[0];
  const searchResults = [
    ...snapshot.projects.map((project) => ({
      type: "Project",
      label: project.name,
      detail: stateLabels[project.state],
      view: "projects" as View,
    })),
    ...snapshot.assets.map((asset) => ({
      type: "Asset",
      label: asset.name,
      detail: asset.type,
      view: "library" as View,
    })),
    ...snapshot.testCards.map((card) => ({
      type: "Test Card",
      label: card.title,
      detail: strategyLabels[card.strategy],
      view: "projects" as View,
    })),
  ].filter((result) =>
    `${result.label} ${result.detail}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="sidebar">
        <button
          className="brand-lockup"
          type="button"
          onClick={() => setView("studio")}
          aria-label="RelayFrame overview"
        >
          <span className="brand-symbol">
            <span />
            <span />
          </span>
          <b>RelayFrame</b>
        </button>

        <button
          className="workspace-switcher"
          type="button"
          aria-label="Switch workspace"
          onClick={() =>
            setNotice("Northstar Creative is the active demo workspace")
          }
        >
          <span>NC</span>
          <span>
            <b>{snapshot.organization.name}</b>
            <small>Agency workspace</small>
          </span>
          <ChevronDown size={14} />
        </button>

        <nav aria-label="Primary">
          <p>Create</p>
          {nav.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              type="button"
              onClick={() => setView(item.id)}
              title={item.label}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </button>
          ))}
          <button
            className="mobile-more"
            type="button"
            onClick={() => setSearchOpen(true)}
          >
            <MoreHorizontal size={17} />
            <span>More tools</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="credit-mini">
            <div>
              <span>Monthly usage</span>
              <b>{snapshot.availableCredits.toLocaleString()} credits</b>
            </div>
            <div className="mini-progress">
              <i style={{ width: "34%" }} />
            </div>
          </div>
          <button type="button" onClick={() => setModal({ kind: "settings" })}>
            <Settings size={17} />
            <span>Settings</span>
          </button>
          <button
            className="profile-row"
            type="button"
            onClick={() => setModal({ kind: "profile" })}
          >
            <span className="avatar">SS</span>
            <span>
              <b>Shourya</b>
              <small>Workspace owner</small>
            </span>
            <MoreHorizontal size={16} />
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button
            className="icon-button sidebar-toggle"
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose size={18} />
          </button>
          <button
            className="search-trigger"
            type="button"
          aria-label="Search projects, assets, and prompts"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={16} />
            <span>Search projects, assets, prompts...</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <span className="system-status">
              <i />
              Demo provider healthy
            </span>
            <button
              className="credit-pill"
              type="button"
              onClick={() => setView("billing")}
            >
              <Zap size={14} />
              {snapshot.availableCredits.toLocaleString()}
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Notifications"
              onClick={() => setModal({ kind: "notifications" })}
            >
              <Bell size={17} />
              <i className="notification-dot" />
            </button>
            <button
              className="primary-button compact"
              type="button"
              onClick={() => setView("studio")}
            >
              <Plus size={16} />
              Generate
            </button>
          </div>
        </header>

        <div className="view-container">
          {view === "home" && (
            <Overview
              snapshot={snapshot}
              onView={setView}
              project={activeProject}
              onModal={(kind) => setModal({ kind })}
              onStudioPrompt={(prompt) => {
                setStudioSeed(prompt);
                setView("studio");
              }}
            />
          )}
          {view === "studio" && (
            <Studio
              snapshot={snapshot}
              models={models}
              promptSeed={studioSeed}
              onModal={(kind) => setModal({ kind })}
              onNotice={setNotice}
              onGenerated={async () => {
                await refresh();
                setNotice("Generation reserved and queued");
              }}
            />
          )}
          {view === "projects" && (
            <ProjectsView
              snapshot={snapshot}
              onModal={(kind) => setModal({ kind })}
              onChanged={async (message) => {
                await refresh();
                setNotice(message);
              }}
            />
          )}
          {view === "library" && (
            <LibraryView
              snapshot={snapshot}
              onModal={(kind, payload) => setModal({ kind, ...payload })}
              onNotice={setNotice}
            />
          )}
          {view === "jobs" && (
            <JobsView
              snapshot={snapshot}
              onModal={(job) => setModal({ kind: "job", job })}
              onView={setView}
            />
          )}
          {view === "brand" && (
            <BrandView
              snapshot={snapshot}
              onEdit={() => setModal({ kind: "brand" })}
            />
          )}
          {view === "billing" && (
            <BillingView
              snapshot={snapshot}
              onModal={(kind) => setModal({ kind })}
              onNotice={setNotice}
            />
          )}
        </div>
      </main>

      {searchOpen && (
        <div
          className="command-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-label="Search RelayFrame">
            <div className="command-input">
              <Search size={18} />
              <input
                autoFocus
                aria-label="Search everything"
                placeholder="Search everything..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={16} />
              </button>
            </div>
            <p>{searchQuery ? "Search results" : "Quick navigation"}</p>
            {searchQuery
              ? searchResults.slice(0, 8).map((result, index) => (
                  <button
                    type="button"
                    key={`${result.type}-${result.label}-${index}`}
                    onClick={() => {
                      setView(result.view);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Search size={16} />
                    <span>
                      {result.label}
                      <small>{result.type} · {result.detail}</small>
                    </span>
                    <ArrowRight size={15} />
                  </button>
                ))
              : [...nav, ...secondaryNav].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      setSearchOpen(false);
                    }}
                  >
                    <item.icon size={17} />
                    <span>{item.label}</span>
                    <ArrowRight size={15} />
                  </button>
                ))}
            {searchQuery && searchResults.length === 0 && (
              <div className="command-empty">No matching projects, assets, or Test Cards.</div>
            )}
          </section>
        </div>
      )}

      {modal && (
        <InteractionModal
          kind={modal.kind}
          payload={{ asset: modal.asset, job: modal.job }}
          project={activeProject}
          brand={snapshot.brands[0]}
          models={models}
          audits={snapshot.audits}
          onClose={() => setModal(null)}
          onRefresh={refresh}
          onNotice={setNotice}
          onCamera={(value) => {
            setStudioSeed((current) => `${current || ""}${current ? ". " : ""}${value}`);
          }}
        />
      )}

      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
        </div>
      )}
    </div>
  );
}

function Overview({
  snapshot,
  onView,
  project,
  onModal,
  onStudioPrompt,
}: {
  snapshot: Snapshot;
  onView: (view: View) => void;
  project: Project;
  onModal: (kind: ModalKind) => void;
  onStudioPrompt: (prompt: string) => void;
}) {
  const approvedCards = snapshot.testCards.filter(
    (card) => card.state === "approved",
  ).length;
  const activeJobs = snapshot.generations.filter(
    (generation) =>
      !["completed", "failed", "rejected", "cancelled"].includes(
        generation.state,
      ),
  ).length;

  return (
    <div className="overview-view">
      <div className="page-heading overview-heading">
        <div>
          <p className="eyebrow">Saturday, July 18</p>
          <h1>Good afternoon, Shourya.</h1>
          <p>Turn the next creative hypothesis into something worth testing.</p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onModal("project")}
          >
            <Plus size={15} />
            New project
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onModal("upload")}
          >
            <Upload size={15} />
            Import assets
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onView("studio")}
          >
            <Sparkles size={16} />
            New generation
          </button>
        </div>
      </div>

      <section className="quick-create">
        <div className="quick-create-copy">
          <span className="ai-orb">
            <Sparkles size={18} />
          </span>
          <div>
            <p>Creative copilot</p>
            <h2>What should we make next?</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onStudioPrompt(
              "Premium product campaign with three controlled creative variants",
            )
          }
        >
          Describe an image, video, or campaign batch...
          <span>
            <Command size={14} />
            Enter
          </span>
        </button>
        <div className="suggestion-row">
          <span>Try</span>
          <button
            type="button"
            onClick={() =>
              onStudioPrompt(
                "Premium product hero on a sculptural plinth, editorial lighting",
              )
            }
          >
            Product hero
          </button>
          <button
            type="button"
            onClick={() =>
              onStudioPrompt(
                "Authentic UGC storyboard showing a complete product ritual",
              )
            }
          >
            UGC storyboard
          </button>
          <button
            type="button"
            onClick={() =>
              onStudioPrompt(
                "Create six controlled launch variants across hook and visual treatment",
              )
            }
          >
            Launch variants
          </button>
        </div>
      </section>

      <div className="metric-grid">
        <Metric
          icon={FolderKanban}
          label="Active projects"
          value={String(snapshot.projects.length)}
          detail="1 awaiting review"
          tone="lime"
        />
        <Metric
          icon={BadgeCheck}
          label="Approved concepts"
          value={String(approvedCards)}
          detail={`${snapshot.testCards.length} total Test Cards`}
          tone="blue"
        />
        <Metric
          icon={Activity}
          label="Jobs running"
          value={String(activeJobs)}
          detail={activeJobs ? "Provider processing" : "Queue is clear"}
          tone="purple"
        />
        <Metric
          icon={CircleDollarSign}
          label="Credits available"
          value={snapshot.availableCredits.toLocaleString()}
          detail="Agency monthly pool"
          tone="orange"
        />
      </div>

      <div className="overview-columns">
        <section className="panel active-project-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Continue working</p>
              <h2>{project.name}</h2>
            </div>
            <button type="button" onClick={() => onView("projects")}>
              Open project <ArrowRight size={15} />
            </button>
          </div>
          <div className="project-progress">
            {[
              ["Brief", true],
              ["Strategy", true],
              ["Storyboard", true],
              ["Production", false],
              ["Review", false],
            ].map(([label, complete], index) => (
              <div className={complete ? "is-complete" : ""} key={String(label)}>
                <span>{complete ? <Check size={12} /> : index + 1}</span>
                <p>{label}</p>
              </div>
            ))}
          </div>
          <div className="storyboard-strip">
            {snapshot.storyboardFrames.slice(0, 3).map((frame) => (
              <div key={frame.id}>
                <AssetArt
                  url={frame.imageUrl!}
                  label={frame.shot}
                  className="storyboard-thumb"
                />
                <span>
                  {frame.approval === "approved" ? (
                    <Check size={11} />
                  ) : (
                    <Clock3 size={11} />
                  )}
                </span>
              </div>
            ))}
            <div className="project-summary">
              <p>{project.objective}</p>
              <div>
                <span className="avatar-stack">
                  <i>SS</i>
                  <i>AK</i>
                  <i>+2</i>
                </span>
                <small>Updated {relativeTime(project.updatedAt, snapshot.snapshotAt)}</small>
              </div>
            </div>
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Workspace</p>
              <h2>Recent activity</h2>
            </div>
            <button
              type="button"
              onClick={() => onModal("notifications")}
            >
              View all
            </button>
          </div>
          <div className="activity-list">
            {[
              [BadgeCheck, "2 storyboards approved", "Luma launch sprint", "8m"],
              [MessageSquare, "Ava left a review note", "Calm focus keyframe", "24m"],
              [ImageIcon, "4 concepts generated", "Relay Image Fast", "1h"],
              [CreditCard, "Monthly credits renewed", "+1,250 credits", "2d"],
            ].map(([Icon, title, detail, time], index) => {
              const ActivityIcon = Icon as typeof BadgeCheck;
              return (
                <div key={String(title)}>
                  <span className={`activity-icon activity-${index}`}>
                    <ActivityIcon size={15} />
                  </span>
                  <div>
                    <b>{String(title)}</b>
                    <p>{String(detail)}</p>
                  </div>
                  <small>{String(time)}</small>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span>
        <Icon size={17} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function Studio({
  snapshot,
  models,
  promptSeed,
  onModal,
  onNotice,
  onGenerated,
}: {
  snapshot: Snapshot;
  models: ModelCapability[];
  promptSeed: string;
  onModal: (kind: ModalKind) => void;
  onNotice: (message: string) => void;
  onGenerated: () => Promise<void>;
}) {
  const [operation, setOperation] =
    useState<Generation["operation"]>("text_to_image");
  const eligibleModels = models.filter((model) =>
    model.operations.includes(operation),
  );
  const [modelId, setModelId] = useState(eligibleModels[0]?.id ?? "");
  const [prompt, setPrompt] = useState(
    promptSeed ||
      "Premium functional beverage on a sculptural stone plinth, calm morning light, editorial product photography, sage and citrus palette",
  );
  const [aspectRatio, setAspectRatio] = useState("4:5");
  const [outputCount, setOutputCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveModelId = eligibleModels.some((model) => model.id === modelId)
    ? modelId
    : (eligibleModels[0]?.id ?? "");
  const selectedModel = models.find((model) => model.id === effectiveModelId);
  const supportedRatios = selectedModel?.aspectRatios ?? ["1:1"];
  const effectiveAspectRatio = supportedRatios.includes(aspectRatio)
    ? aspectRatio
    : supportedRatios[0];
  const effectiveOutputCount = Math.min(
    outputCount,
    selectedModel?.maxOutputs ?? 1,
  );
  const estimate = selectedModel
    ? Math.ceil(
        (selectedModel.baseCredits +
          selectedModel.creditPerOutput * effectiveOutputCount) *
          (operation.includes("video") ? 2.4 : 1),
      )
    : 0;

  async function generate() {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-relayframe-organization": "org_demo",
        },
        body: JSON.stringify({
          projectId: snapshot.projects[0]?.id,
          operation,
          prompt,
          modelId: effectiveModelId,
          aspectRatio: effectiveAspectRatio,
          outputCount: effectiveOutputCount,
          idempotencyKey: `ui-${crypto.randomUUID()}`,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Generation failed");
      await onGenerated();
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : "Generation failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="studio-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Prism creative studio</p>
          <h1>What will you create?</h1>
          <p>One idea, routed to the right model, with every decision preserved.</p>
        </div>
        <div className="model-health">
          <span><i /> {models.length} models available</span>
          <button type="button" onClick={() => onModal("capabilities")}>
            Capability registry
          </button>
        </div>
      </div>

      <div className="studio-layout">
        <section className="generator-panel">
          <div className="preset-carousel" aria-label="Creative presets">
            {[
              ["Product film", "Premium product hero in sculptural studio light, cinematic material detail"],
              ["UGC story", "Authentic handheld creator story with a direct hook and product demonstration"],
              ["Editorial", "High-fashion editorial composition, graphic color blocking, precise negative space"],
              ["Launch ad", "Fast-paced launch campaign visual with bold typography-safe composition"],
            ].map(([label, value], index) => (
              <button
                type="button"
                key={label}
                onClick={() => {
                  setPrompt(value);
                  onNotice(`${label} preset applied`);
                }}
              >
                <i className={`preset-visual preset-${index}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="operation-tabs" role="tablist" aria-label="Generation type">
            {[
              ["text_to_image", ImageIcon, "Image"],
              ["image_to_image", Layers3, "Edit"],
              ["text_to_video", Film, "Video"],
              ["image_to_video", Play, "Animate"],
            ].map(([id, Icon, label]) => {
              const TabIcon = Icon as typeof ImageIcon;
              return (
                <button
                  key={String(id)}
                  className={operation === id ? "is-active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={operation === id}
                  onClick={() => setOperation(id as Generation["operation"])}
                >
                  <TabIcon size={15} />
                  {String(label)}
                </button>
              );
            })}
          </div>

          <label className="prompt-field">
            <span>
              Describe your idea
              <small>{prompt.length} / 4,000</small>
            </span>
            <textarea
              value={prompt}
              maxLength={4000}
              onChange={(event) => setPrompt(event.target.value)}
              rows={7}
            />
            <div className="prompt-tools">
              <button
                type="button"
                onClick={() => {
                  setPrompt((value) =>
                    `${value}. Apply Luma Labs brand palette, evidence-aware tone, and approved product claims only.`,
                  );
                  onNotice("Brand rules applied to prompt");
                }}
              ><BriefcaseBusiness size={14} /> Apply brand</button>
              <button type="button" onClick={() => onModal("camera")}><Aperture size={14} /> Camera recipe</button>
              <button
                type="button"
                onClick={() => {
                  setPrompt((value) =>
                    `${value}. Add precise composition, realistic material detail, controlled highlights, and production-ready negative space.`,
                  );
                  onNotice("Prompt enhanced");
                }}
              ><Sparkles size={14} /> Enhance</button>
            </div>
          </label>

          {operation.includes("image_to") && (
            <button
              className="reference-drop"
              type="button"
              onClick={() => onModal("upload")}
            >
              <Upload size={20} />
              <span><b>Add reference media</b><small>PNG, JPG or WEBP up to 20 MB</small></span>
            </button>
          )}

          <div className="studio-settings">
            <label>
              <span>Model</span>
              <select
                value={effectiveModelId}
                onChange={(event) => setModelId(event.target.value)}
              >
                {eligibleModels.map((model) => (
                  <option value={model.id} key={model.id}>
                    {model.displayName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Aspect ratio</span>
              <select
                value={effectiveAspectRatio}
                onChange={(event) => setAspectRatio(event.target.value)}
              >
                {supportedRatios.map((ratio) => (
                  <option key={ratio}>{ratio}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Outputs</span>
              <select
                value={effectiveOutputCount}
                onChange={(event) => setOutputCount(Number(event.target.value))}
              >
                {Array.from(
                  { length: selectedModel?.maxOutputs ?? 1 },
                  (_, index) => index + 1,
                ).map((count) => (
                  <option key={count}>{count}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="generation-cost">
            <div>
              <ShieldCheck size={17} />
              <span>
                <b>Estimated before submission</b>
                Credits are reserved, then settled to actual cost.
              </span>
            </div>
            <strong>{estimate} credits</strong>
          </div>

          {error && <p className="form-error">{error}</p>}
          <button
            className="generate-button"
            type="button"
            disabled={submitting || prompt.trim().length < 8 || !effectiveModelId}
            onClick={generate}
          >
            {submitting ? (
              <><span className="spinner" /> Reserving & queuing...</>
            ) : (
              <><Sparkles size={17} /> Generate {effectiveOutputCount} concepts <ArrowRight size={16} /></>
            )}
          </button>
        </section>

        <aside className="studio-aside">
          <div className="brand-context-card">
            <div>
              <span className="brand-mark">L</span>
              <div><b>Luma Labs</b><small>Brand rules v3</small></div>
              <BadgeCheck size={16} />
            </div>
            <ul>
              <li><Check size={12} /> 2 approved claims applied</li>
              <li><Check size={12} /> 3 prohibited claims checked</li>
              <li><Check size={12} /> Required disclaimer attached</li>
            </ul>
          </div>
          <div className="model-detail-card">
            <p className="eyebrow">Selected model</p>
            <h3>{selectedModel?.displayName ?? "Choose a model"}</h3>
            <p>
              {selectedModel?.qualityTier === "premium"
                ? "High-fidelity output for approved hero concepts."
                : "Fast visual exploration before premium production."}
            </p>
            <dl>
              <div><dt>Typical latency</dt><dd>{selectedModel?.estimatedLatencySeconds.join("–")}s</dd></div>
              <div><dt>Commercial use</dt><dd>{selectedModel?.commercialUse ? "Allowed" : "Restricted"}</dd></div>
              <div><dt>References</dt><dd>{selectedModel?.supportsReferences ? "Supported" : "No"}</dd></div>
            </dl>
          </div>
          <div className="lineage-note">
            <Boxes size={18} />
            <div>
              <b>Lineage is automatic</b>
              <p>Prompt, model, brand rules, source assets, cost and outputs remain connected.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ProjectsView({
  snapshot,
  onModal,
  onChanged,
}: {
  snapshot: Snapshot;
  onModal: (kind: ModalKind) => void;
  onChanged: (message: string) => Promise<void>;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState(
    snapshot.projects[0].id,
  );
  const project =
    snapshot.projects.find((item) => item.id === selectedProjectId) ??
    snapshot.projects[0];
  const cards = snapshot.testCards.filter((card) => card.projectId === project.id);
  const cardIds = new Set(cards.map((card) => card.id));
  const [pendingCard, setPendingCard] = useState<string | null>(null);
  const [producing, setProducing] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  async function updateCard(cardId: string, state: TestCard["state"]) {
    setPendingCard(cardId);
    setMutationError(null);
    try {
      const response = await fetch(`/api/test-cards/${cardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-relayframe-organization": "org_demo",
        },
        body: JSON.stringify({ state }),
      });
      if (!response.ok) throw new Error("Could not update Test Card");
      await onChanged(
        state === "approved" ? "Test Card approved" : "Test Card updated",
      );
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Update failed");
    } finally {
      setPendingCard(null);
    }
  }

  async function produceApproved() {
    setProducing(true);
    setMutationError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/produce`, {
        method: "POST",
        headers: { "x-relayframe-organization": "org_demo" },
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Production failed");
      }
      await onChanged("Approved concepts queued for production");
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Production failed");
    } finally {
      setProducing(false);
    }
  }

  return (
    <div className="projects-view">
      <div className="page-heading project-page-heading">
        <div>
          <label className="project-picker">
            <span>Project</span>
            <select
              value={project.id}
              onChange={(event) => setSelectedProjectId(event.target.value)}
            >
              {snapshot.projects.map((item) => (
                <option value={item.id} key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <div className="project-title-row">
            <h1>{project.name}</h1>
            <span className="project-state">{stateLabels[project.state]}</span>
          </div>
          <p>{project.objective}</p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onModal("review")}
          ><Users size={15} /> Share review</button>
          <button
            className="primary-button"
            type="button"
            disabled={producing}
            onClick={() => void produceApproved()}
          ><Film size={15} /> {producing ? "Queuing..." : "Produce approved"}</button>
        </div>
      </div>

      <div className="project-summary-bar">
        <div><Target size={17} /><span><small>Objective</small><b>Find the strongest launch hook</b></span></div>
        <div><Users size={17} /><span><small>Audience</small><b>Creative professionals, 24–40</b></span></div>
        <div><CircleDollarSign size={17} /><span><small>Budget</small><b>{project.budgetCredits} credits</b></span></div>
        <div><Film size={17} /><span><small>Placements</small><b>{project.aspectRatios.join(" · ")}</b></span></div>
      </div>

      <section className="test-card-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Strategy matrix</p>
            <h2>Creative Test Cards</h2>
            <p>Each concept changes one strategic variable while preserving the campaign constants.</p>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onModal("test-card")}
          ><Plus size={15} /> Add Test Card</button>
        </div>
        {mutationError && <p className="inline-error">{mutationError}</p>}
        <div className="test-card-grid">
          {cards.map((card, index) => (
            <article className={`test-card test-card-${index}`} key={card.id}>
              <div className="test-card-top">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span className={`card-state state-${card.state}`}>
                  {card.state}
                </span>
              </div>
              <p className="strategy-label">{strategyLabels[card.strategy]}</p>
              <h3>{card.title}</h3>
              <blockquote>“{card.hook}”</blockquote>
              <dl>
                <div><dt>Promise</dt><dd>{card.promise}</dd></div>
                <div><dt>Proof</dt><dd>{card.proof}</dd></div>
                <div><dt>Changes</dt><dd>{card.changedVariable}</dd></div>
              </dl>
              <div className="constant-tags">
                {card.heldConstants.map((constant) => <span key={constant}>{constant}</span>)}
              </div>
              <div className="card-actions">
                <button
                  type="button"
                  className={card.state === "rejected" ? "is-selected" : ""}
                  disabled={pendingCard === card.id}
                  onClick={() => updateCard(card.id, "rejected")}
                >
                  <X size={14} /> Reject
                </button>
                <button
                  type="button"
                  className={card.state === "approved" ? "is-selected approve" : "approve"}
                  disabled={pendingCard === card.id}
                  onClick={() => updateCard(card.id, "approved")}
                >
                  <Check size={14} /> Approve
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="storyboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Pre-production gate</p>
            <h2>Approved storyboards</h2>
            <p>Review inexpensive keyframes before committing credits to motion.</p>
          </div>
          <span className="cost-saving"><ShieldCheck size={14} /> Final video spend protected</span>
        </div>
        <div className="storyboard-grid">
          {snapshot.storyboardFrames
            .filter((frame) => cardIds.has(frame.testCardId))
            .map((frame) => (
            <article key={frame.id}>
              <AssetArt url={frame.imageUrl!} label={frame.shot} />
              <div>
                <span>Frame {frame.ordinal + 1}</span>
                <b>{frame.shot}</b>
                <p>{frame.camera}</p>
              </div>
              <span className={`frame-status ${frame.approval}`}>
                {frame.approval === "approved" ? <Check size={12} /> : <Clock3 size={12} />}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function LibraryView({
  snapshot,
  onModal,
  onNotice,
}: {
  snapshot: Snapshot;
  onModal: (
    kind: ModalKind,
    payload?: { asset?: Asset; job?: Generation },
  ) => void;
  onNotice: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const filteredAssets = snapshot.assets.filter(
    (asset) =>
      (type === "all" || asset.type === type) &&
      asset.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="library-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Searchable creative memory</p>
          <h1>Library</h1>
          <p>Sources, intermediates and approved outputs with complete lineage.</p>
        </div>
        <div className="heading-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => onModal("upload")}
          ><Upload size={15} /> Upload</button>
          <button
            className="primary-button"
            type="button"
            onClick={() => onModal("folder")}
          ><Plus size={15} /> New folder</button>
        </div>
      </div>
      <div className="library-toolbar">
        <div><Search size={15} /><input aria-label="Search assets" placeholder="Search assets..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <select aria-label="Filter media type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All media</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="reference">References</option>
          <option value="logo">Logos</option>
        </select>
        <button type="button" onClick={() => onNotice("Showing assets across all projects")}>All projects <ChevronDown size={13} /></button>
        <span>{filteredAssets.length} assets</span>
      </div>
      <div className="asset-grid">
        {filteredAssets.map((asset) => (
          <article key={asset.id} onDoubleClick={() => onModal("asset", { asset })}>
            <button className="asset-preview-button" type="button" onClick={() => onModal("asset", { asset })}>
              <AssetArt url={asset.url} label={asset.name} />
            </button>
            <div className="asset-meta">
              <span className="asset-type"><ImageIcon size={12} /> {asset.type}</span>
              <button type="button" aria-label={`More options for ${asset.name}`} onClick={() => onModal("asset", { asset })}><MoreHorizontal size={16} /></button>
              <b>{asset.name}</b>
              <p>{asset.width} × {asset.height} · {relativeTime(asset.createdAt, snapshot.snapshotAt)}</p>
              {asset.generationId && <small><Boxes size={11} /> Generated with lineage</small>}
            </div>
          </article>
        ))}
        <button className="upload-card" type="button" onClick={() => onModal("upload")}>
          <Upload size={22} />
          <b>Upload source media</b>
          <span>Images, video, logos and references</span>
        </button>
      </div>
    </div>
  );
}

function JobsView({
  snapshot,
  onModal,
  onView,
}: {
  snapshot: Snapshot;
  onModal: (job: Generation) => void;
  onView: (view: View) => void;
}) {
  return (
    <div className="jobs-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Execution plane</p>
          <h1>Job center</h1>
          <p>Provider execution, media processing, moderation and credit settlement.</p>
        </div>
      </div>
      {snapshot.generations.length === 0 ? (
        <div className="empty-state">
          <span><Activity size={25} /></span>
          <h2>No generation jobs yet</h2>
          <p>Start in Generate to see durable job progress and settlement.</p>
          <button
            className="primary-button"
            type="button"
            onClick={() => onView("studio")}
          >
            <Sparkles size={15} /> Start generation
          </button>
        </div>
      ) : (
        <section className="job-table panel">
          <div className="job-table-head">
            <span>Job</span><span>Model</span><span>Status</span><span>Progress</span><span>Cost</span><span>Created</span>
          </div>
          {snapshot.generations.map((generation) => (
            <button
              className="job-row"
              key={generation.id}
              type="button"
              onClick={() => onModal(generation)}
            >
              <span><b>{generation.operation.replaceAll("_", " ")}</b><small>{generation.id.slice(0, 12)}</small></span>
              <span>{generation.modelId}</span>
              <StatusDot state={generation.state} />
              <span className="job-progress"><i style={{ width: `${generation.progress}%` }} /><small>{generation.progress}%</small></span>
              <span>{generation.state === "completed" ? generation.consumedCredits : generation.reservedCredits} cr</span>
              <span>{relativeTime(generation.createdAt, snapshot.snapshotAt)}</span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function BrandView({
  snapshot,
  onEdit,
}: {
  snapshot: Snapshot;
  onEdit: () => void;
}) {
  const brand = snapshot.brands[0];
  return (
    <div className="brand-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Versioned generation context</p>
          <h1>Brand system</h1>
          <p>Guardrails automatically compiled into every relevant generation.</p>
        </div>
        <div className="heading-actions">
          <span className="version-badge"><BadgeCheck size={14} /> Version {brand.version}</span>
          <button className="primary-button" type="button" onClick={onEdit}>
            Edit brand pack
          </button>
        </div>
      </div>
      <div className="brand-layout">
        <section className="brand-hero panel">
          <div className="brand-identity">
            <span>L</span>
            <div><h2>{brand.name}</h2><a href={brand.website}>{brand.website}</a></div>
          </div>
          <p>{brand.description}</p>
          <div className="palette-row">
            {brand.colors.map((color) => <span key={color} style={{ background: color }}><i>{color}</i></span>)}
          </div>
          <div className="tone-row">
            {brand.tone.map((tone) => <span key={tone}>{tone}</span>)}
          </div>
        </section>
        <section className="brand-rules panel">
          <div className="rule-column approved">
            <h3><Check size={15} /> Approved claims</h3>
            {brand.approvedClaims.map((claim) => <p key={claim}>{claim}</p>)}
          </div>
          <div className="rule-column prohibited">
            <h3><X size={15} /> Prohibited claims</h3>
            {brand.prohibitedClaims.map((claim) => <p key={claim}>{claim}</p>)}
          </div>
          <div className="rule-column disclaimer">
            <h3><ShieldCheck size={15} /> Required language</h3>
            {brand.requiredDisclaimers.map((claim) => <p key={claim}>{claim}</p>)}
          </div>
        </section>
        <section className="audience-panel panel">
          <div className="panel-heading"><div><p className="eyebrow">Audience memory</p><h2>Priority segments</h2></div></div>
          {brand.audiences.map((audience, index) => (
            <div className="audience-row" key={audience}>
              <span>{index + 1}</span><p>{audience}</p><button type="button" aria-label={`Edit audience: ${audience}`} onClick={onEdit}><MoreHorizontal size={15} /></button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function BillingView({
  snapshot,
  onModal,
  onNotice,
}: {
  snapshot: Snapshot;
  onModal: (kind: ModalKind) => void;
  onNotice: (message: string) => void;
}) {
  const consumed = snapshot.ledger
    .filter((entry) => entry.type === "consumption")
    .reduce((sum, entry) => sum + entry.amount, 0);
  function exportLedger() {
    const rows = [
      ["id", "type", "amount", "generation_id", "created_at"],
      ...snapshot.ledger.map((entry) => [
        entry.id,
        entry.type,
        String(entry.amount),
        entry.generationId ?? "",
        entry.createdAt,
      ]),
    ];
    const blob = new Blob(
      [rows.map((row) => row.map((cell) => JSON.stringify(cell)).join(",")).join("\n")],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "relayframe-credit-ledger.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    onNotice("Ledger CSV exported");
  }
  return (
    <div className="billing-view">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Transparent unit economics</p>
          <h1>Usage & billing</h1>
          <p>Immutable credit events, reservations and actual settlement.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onModal("credits")}>Buy credits</button>
      </div>
      <div className="billing-cards">
        <article className="balance-card">
          <span><Zap size={18} /></span>
          <p>Available balance</p>
          <strong>{snapshot.availableCredits.toLocaleString()}</strong>
          <small>credits</small>
          <button type="button" onClick={() => onModal("settings")}>Manage plan <ArrowRight size={14} /></button>
        </article>
        <article><p>Current plan</p><strong>Agency</strong><small>10 brands · 10 seats · priority queue</small></article>
        <article><p>Consumed this cycle</p><strong>{consumed}</strong><small>credits settled to completed jobs</small></article>
        <article><p>Next renewal</p><strong>Aug 18</strong><small>1,250 credits added monthly</small></article>
      </div>
      <section className="ledger-panel panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Reconstructable balance</p><h2>Credit ledger</h2></div>
          <button type="button" onClick={exportLedger}>Export CSV</button>
        </div>
        <div className="ledger-list">
          {[...snapshot.ledger].reverse().map((entry) => (
            <div key={entry.id}>
              <span className={`ledger-icon ledger-${entry.type}`}>
                {["grant", "purchase", "release", "refund"].includes(entry.type) ? <Plus size={14} /> : <Zap size={14} />}
              </span>
              <span><b>{entry.type}</b><small>{entry.generationId ?? "Monthly allowance"}</small></span>
              <span>{relativeTime(entry.createdAt, snapshot.snapshotAt)}</span>
              <strong className={["grant", "purchase", "release", "refund"].includes(entry.type) ? "positive" : ""}>
                {["grant", "purchase", "release", "refund"].includes(entry.type) ? "+" : "−"}{entry.amount}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
