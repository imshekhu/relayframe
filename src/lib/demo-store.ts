import "server-only";

import { randomUUID } from "node:crypto";
import {
  generationProgress,
  isTerminalGenerationState,
} from "@/domain/generation-machine";
import {
  calculateCreditBalance,
  consumptionIdempotencyKey,
  releaseIdempotencyKey,
  reservationIdempotencyKey,
} from "@/domain/ledger";
import type {
  Asset,
  AuditEvent,
  Brand,
  CreativeBrief,
  Generation,
  LedgerEntry,
  Organization,
  Project,
  StoryboardFrame,
  TestCard,
} from "@/domain/types";
import type { GenerationRequest } from "@/domain/schemas";
import { resolveModel } from "@/providers/registry";

const ORG_ID = "org_demo";
const USER_ID = "usr_demo";
const now = new Date().toISOString();

type InternalGeneration = Generation & {
  providerJobId?: string;
  idempotencyKey: string;
};

type DemoState = {
  organization: Organization;
  brands: Brand[];
  projects: Project[];
  briefs: CreativeBrief[];
  testCards: TestCard[];
  storyboardFrames: StoryboardFrame[];
  assets: Asset[];
  generations: InternalGeneration[];
  ledger: LedgerEntry[];
  audits: AuditEvent[];
};

function initialState(): DemoState {
  const projectId = "prj_luma-launch";
  const cards: TestCard[] = [
    {
      id: "card_problem",
      projectId,
      strategy: "problem_solution",
      title: "The 3PM crash",
      audience: "Busy creative professionals",
      hook: "Your afternoon should not feel like a shutdown.",
      promise: "Steady, focused energy without the spike.",
      proof: "Ingredient close-ups and a real-time focus ritual.",
      offer: "20% launch bundle",
      visualTreatment: "Natural desk light, handheld macro photography",
      changedVariable: "Pain-first hook",
      heldConstants: ["Product", "Offer", "CTA", "9:16"],
      state: "approved",
    },
    {
      id: "card_demo",
      projectId,
      strategy: "demonstration",
      title: "One scoop, one ritual",
      audience: "Morning routine optimizers",
      hook: "Watch a better workday take shape in 12 seconds.",
      promise: "A simple daily focus ritual.",
      proof: "Product preparation shown from package to first sip.",
      offer: "20% launch bundle",
      visualTreatment: "Precision overhead demo with kinetic typography",
      changedVariable: "Demonstration structure",
      heldConstants: ["Product", "Offer", "CTA", "9:16"],
      state: "approved",
    },
    {
      id: "card_objection",
      projectId,
      strategy: "objection",
      title: "Not another energy drink",
      audience: "Caffeine-sensitive knowledge workers",
      hook: "Focus does not have to feel frantic.",
      promise: "Calm energy designed for deep work.",
      proof: "Ingredient callouts with required qualification.",
      offer: "20% launch bundle",
      visualTreatment: "Editorial split-screen, calm versus chaotic",
      changedVariable: "Objection handling",
      heldConstants: ["Product", "Offer", "CTA", "9:16"],
      state: "draft",
    },
    {
      id: "card_social",
      projectId,
      strategy: "social_proof",
      title: "The creative team test",
      audience: "Agency and studio teams",
      hook: "Five creatives replaced their second coffee.",
      promise: "A team ritual for the afternoon sprint.",
      proof: "Approved customer quotes; no fabricated metrics.",
      offer: "20% launch bundle",
      visualTreatment: "Fast-cut documentary office portraits",
      changedVariable: "Social proof",
      heldConstants: ["Product", "Offer", "CTA", "9:16"],
      state: "draft",
    },
  ];

  return {
    organization: {
      id: ORG_ID,
      name: "Northstar Creative",
      slug: "northstar",
      plan: "agency",
      createdAt: now,
    },
    brands: [
      {
        id: "brand_luma",
        organizationId: ORG_ID,
        name: "Luma Labs",
        website: "https://example.com",
        description:
          "A modern functional beverage brand for creative professionals who want sustained, calm focus.",
        colors: ["#F0FF8A", "#18211B", "#FAF7EF", "#FF7A59"],
        tone: ["Clear", "Optimistic", "Evidence-aware", "Never frantic"],
        audiences: [
          "Creative professionals aged 24–40",
          "Remote knowledge workers",
          "Small agency teams",
        ],
        approvedClaims: [
          "Made with thoughtfully selected ingredients",
          "Designed for a calm focus ritual",
        ],
        prohibitedClaims: [
          "Treats ADHD",
          "Clinically proven",
          "Guaranteed productivity",
        ],
        requiredDisclaimers: [
          "Individual experiences vary.",
          "Contains caffeine.",
        ],
        version: 3,
        updatedAt: now,
      },
    ],
    projects: [
      {
        id: projectId,
        organizationId: ORG_ID,
        brandId: "brand_luma",
        name: "Luma launch sprint",
        objective: "Find the strongest paid-social hook for the launch bundle.",
        state: "storyboard_review",
        aspectRatios: ["9:16", "1:1"],
        budgetCredits: 320,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "prj_summer-refresh",
        organizationId: ORG_ID,
        brandId: "brand_luma",
        name: "Summer creative refresh",
        objective: "Refresh evergreen product demonstrations before fatigue.",
        state: "draft",
        aspectRatios: ["9:16"],
        budgetCredits: 180,
        createdAt: now,
        updatedAt: now,
      },
    ],
    briefs: [
      {
        id: "brief_luma",
        projectId,
        product: "Luma Focus Blend",
        campaignObjective:
          "Identify a repeatable hook for paid social while preserving premium positioning.",
        audience: "Creative professionals who experience afternoon fatigue.",
        offer: "20% off the launch bundle",
        emotion: "Calm momentum",
        placement: "Instagram Reels and TikTok",
        constraints: [
          "Do not imply medical benefit",
          "Show packaging accurately",
          "Keep captions inside 9:16 safe area",
        ],
        createdAt: now,
      },
    ],
    testCards: cards,
    storyboardFrames: cards.slice(0, 2).flatMap((card, cardIndex) =>
      [
        ["Pattern break", "A better 3PM starts here", "35mm push-in"],
        ["Product proof", "One scoop. Calm focus.", "Overhead macro"],
        ["Offer and CTA", "Build your focus ritual", "Locked hero frame"],
      ].map(([shot, overlay, camera], ordinal) => ({
        id: `frame_${cardIndex}_${ordinal}`,
        testCardId: card.id,
        ordinal,
        shot,
        overlay,
        camera,
        imageUrl: `/api/demo-output/storyboard-${card.id}/${ordinal}`,
        approval: ordinal < 2 ? "approved" : "pending",
      })),
    ),
    assets: [
      {
        id: "asset_pack",
        organizationId: ORG_ID,
        projectId,
        type: "reference",
        name: "Luma product pack",
        url: "/api/demo-output/asset-pack/0",
        width: 1400,
        height: 1400,
        status: "active",
        createdAt: now,
      },
      {
        id: "asset_keyframe",
        organizationId: ORG_ID,
        projectId,
        type: "image",
        name: "Calm focus keyframe",
        url: "/api/demo-output/asset-keyframe/1",
        width: 1080,
        height: 1920,
        status: "active",
        createdAt: now,
      },
    ],
    generations: [],
    ledger: [
      {
        id: "led_grant",
        organizationId: ORG_ID,
        type: "grant",
        amount: 1250,
        idempotencyKey: "demo:initial-grant",
        createdAt: now,
      },
    ],
    audits: [],
  };
}

const globalStore = globalThis as typeof globalThis & {
  __relayFrameDemoState?: DemoState;
};
const state = (globalStore.__relayFrameDemoState ??= initialState());

function id(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

function addLedger(entry: Omit<LedgerEntry, "id" | "createdAt">) {
  if (state.ledger.some((item) => item.idempotencyKey === entry.idempotencyKey)) {
    return;
  }
  state.ledger.push({ ...entry, id: id("led"), createdAt: new Date().toISOString() });
}

function audit(
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
) {
  state.audits.push({
    id: id("audit"),
    organizationId: ORG_ID,
    actorId: USER_ID,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  });
}

export function requireDemoOrganization(organizationId: string | null) {
  if (organizationId !== ORG_ID) {
    throw new Error("Organization not found");
  }
  return ORG_ID;
}

export function demoSnapshot() {
  return {
    organization: state.organization,
    brands: state.brands,
    projects: state.projects,
    briefs: state.briefs,
    testCards: state.testCards,
    storyboardFrames: state.storyboardFrames,
    assets: state.assets,
    generations: state.generations.map((generation) => {
      const sanitized: Partial<InternalGeneration> = { ...generation };
      delete sanitized.providerJobId;
      delete sanitized.idempotencyKey;
      return sanitized as Generation;
    }),
    ledger: state.ledger,
    audits: state.audits.slice(-20),
    availableCredits: calculateCreditBalance(state.ledger),
  };
}

export async function createDemoGeneration(
  organizationId: string,
  request: GenerationRequest,
) {
  requireDemoOrganization(organizationId);
  const existing = state.generations.find(
    (generation) => generation.idempotencyKey === request.idempotencyKey,
  );
  if (existing) return existing;

  const resolved = resolveModel(request.modelId);
  if (!resolved || !resolved.capability.operations.includes(request.operation)) {
    throw new Error("Requested model does not support this operation");
  }
  const banned = /\b(nude|sexual minor|impersonate a real person)\b/i;
  if (banned.test(request.prompt)) {
    throw new Error("Request rejected by the demo safety policy");
  }

  const generationId = id("gen");
  const canonical = {
    generationId,
    operation: request.operation,
    prompt: request.prompt,
    aspectRatio: request.aspectRatio,
    outputCount: request.outputCount,
    inputAssetUrls: [],
    maxCostCredits: 500,
  };
  const quotedCredits = resolved.provider.quote(canonical);
  if (calculateCreditBalance(state.ledger) < quotedCredits) {
    throw new Error("Insufficient credits");
  }

  const generation: InternalGeneration = {
    id: generationId,
    organizationId,
    projectId: request.projectId,
    operation: request.operation,
    prompt: request.prompt,
    modelId: request.modelId,
    aspectRatio: request.aspectRatio,
    outputCount: request.outputCount,
    state: "queued",
    estimatedCredits: quotedCredits,
    reservedCredits: quotedCredits,
    consumedCredits: 0,
    progress: generationProgress("queued"),
    outputAssetIds: [],
    createdAt: new Date().toISOString(),
    idempotencyKey: request.idempotencyKey,
  };
  state.generations.unshift(generation);
  addLedger({
    organizationId,
    generationId,
    type: "reservation",
    amount: quotedCredits,
    idempotencyKey: reservationIdempotencyKey(generationId),
  });
  const providerJob = await resolved.provider.submit(
    canonical,
    `relay:${generationId}:attempt:1`,
  );
  generation.providerJobId = providerJob.providerJobId;
  generation.state = "provider_running";
  generation.progress = generationProgress("provider_running");
  audit("generation.created", "generation", generationId, {
    modelId: request.modelId,
    reservedCredits: quotedCredits,
  });
  return generation;
}

export async function refreshDemoGenerations(organizationId: string) {
  requireDemoOrganization(organizationId);
  for (const generation of state.generations) {
    if (
      isTerminalGenerationState(generation.state) ||
      !generation.providerJobId
    ) {
      continue;
    }
    const resolved = resolveModel(generation.modelId);
    if (!resolved) continue;
    const providerJob = await resolved.provider.status(generation.providerJobId);
    generation.progress = providerJob.progress;
    if (providerJob.state === "running") {
      generation.state = "provider_running";
      continue;
    }
    if (providerJob.state === "succeeded") {
      generation.state = "completed";
      generation.progress = 100;
      generation.completedAt = new Date().toISOString();
      generation.consumedCredits =
        providerJob.actualCostCredits ?? generation.estimatedCredits;
      for (const [index, url] of providerJob.outputUrls.entries()) {
        const assetId = id("asset");
        state.assets.unshift({
          id: assetId,
          organizationId,
          projectId: generation.projectId,
          type: generation.operation.includes("video") ? "video" : "image",
          name: `Generated concept ${index + 1}`,
          url,
          width: generation.aspectRatio === "9:16" ? 1080 : 1600,
          height: generation.aspectRatio === "9:16" ? 1920 : 1600,
          durationMs: generation.operation.includes("video") ? 8000 : undefined,
          status: "active",
          generationId: generation.id,
          createdAt: new Date().toISOString(),
        });
        generation.outputAssetIds.push(assetId);
      }
      addLedger({
        organizationId,
        generationId: generation.id,
        type: "release",
        amount: generation.reservedCredits,
        idempotencyKey: releaseIdempotencyKey(generation.id),
      });
      addLedger({
        organizationId,
        generationId: generation.id,
        type: "consumption",
        amount: generation.consumedCredits,
        idempotencyKey: consumptionIdempotencyKey(generation.id),
      });
      audit("generation.completed", "generation", generation.id, {
        outputCount: generation.outputAssetIds.length,
      });
    }
  }
  return demoSnapshot();
}

export function updateTestCardState(
  organizationId: string,
  cardId: string,
  cardState: TestCard["state"],
) {
  requireDemoOrganization(organizationId);
  const card = state.testCards.find((item) => item.id === cardId);
  if (!card) throw new Error("Test Card not found");
  card.state = cardState;
  audit("test_card.updated", "test_card", cardId, { state: cardState });
  return card;
}

export function createDemoProject(
  organizationId: string,
  input: { name: string; objective: string; budgetCredits: number },
) {
  requireDemoOrganization(organizationId);
  const project: Project = {
    id: id("prj"),
    organizationId,
    brandId: state.brands[0].id,
    name: input.name,
    objective: input.objective,
    state: "draft",
    aspectRatios: ["9:16"],
    budgetCredits: input.budgetCredits,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.projects.unshift(project);
  audit("project.created", "project", project.id, {
    budgetCredits: project.budgetCredits,
  });
  return project;
}

export function createDemoAsset(
  organizationId: string,
  input: { name: string; type: Asset["type"]; projectId?: string },
) {
  requireDemoOrganization(organizationId);
  if (
    input.projectId &&
    !state.projects.some(
      (project) =>
        project.id === input.projectId &&
        project.organizationId === organizationId,
    )
  ) {
    throw new Error("Project not found");
  }
  const assetId = id("asset");
  const asset: Asset = {
    id: assetId,
    organizationId,
    projectId: input.projectId,
    type: input.type,
    name: input.name,
    url: `/api/demo-output/upload-${assetId}/0`,
    width: input.type === "video" ? 1920 : 1400,
    height: input.type === "video" ? 1080 : 1400,
    durationMs: input.type === "video" ? 8_000 : undefined,
    status: "active",
    createdAt: new Date().toISOString(),
  };
  state.assets.unshift(asset);
  audit("asset.uploaded", "asset", asset.id, { type: asset.type });
  return asset;
}

export function createDemoTestCard(
  organizationId: string,
  input: {
    projectId: string;
    strategy: TestCard["strategy"];
    title: string;
    hook: string;
  },
) {
  requireDemoOrganization(organizationId);
  const project = state.projects.find(
    (item) =>
      item.id === input.projectId && item.organizationId === organizationId,
  );
  if (!project) throw new Error("Project not found");
  const card: TestCard = {
    id: id("card"),
    projectId: input.projectId,
    strategy: input.strategy,
    title: input.title,
    audience: "Primary campaign audience",
    hook: input.hook,
    promise: "Editable promise generated from the campaign brief.",
    proof: "Add approved product proof before production.",
    offer: "Campaign offer",
    visualTreatment: "Editorial product-led treatment",
    changedVariable: strategyLabelsForStore[input.strategy],
    heldConstants: ["Product", "Offer", "CTA", "Placement"],
    state: "draft",
  };
  state.testCards.push(card);
  project.updatedAt = new Date().toISOString();
  audit("test_card.created", "test_card", card.id, {
    projectId: project.id,
  });
  return card;
}

const strategyLabelsForStore: Record<TestCard["strategy"], string> = {
  problem_solution: "Pain-first hook",
  demonstration: "Demonstration structure",
  objection: "Objection handling",
  social_proof: "Social proof",
  comparison: "Comparison frame",
  urgency: "Offer urgency",
};

export function topUpDemoCredits(organizationId: string, amount: number) {
  requireDemoOrganization(organizationId);
  const key = `demo:top-up:${randomUUID()}`;
  addLedger({
    organizationId,
    type: "purchase",
    amount,
    idempotencyKey: key,
  });
  audit("billing.credits_purchased", "organization", organizationId, {
    amount,
  });
  return { amount, availableCredits: calculateCreditBalance(state.ledger) };
}

export function updateDemoBrand(
  organizationId: string,
  brandId: string,
  input: { description: string; tone: string[] },
) {
  requireDemoOrganization(organizationId);
  const brand = state.brands.find(
    (item) => item.id === brandId && item.organizationId === organizationId,
  );
  if (!brand) throw new Error("Brand not found");
  brand.description = input.description;
  brand.tone = input.tone;
  brand.version += 1;
  brand.updatedAt = new Date().toISOString();
  audit("brand.version_created", "brand", brand.id, {
    version: brand.version,
  });
  return brand;
}

export function createDemoReviewLink(
  organizationId: string,
  projectId: string,
) {
  requireDemoOrganization(organizationId);
  const project = state.projects.find(
    (item) =>
      item.id === projectId && item.organizationId === organizationId,
  );
  if (!project) throw new Error("Project not found");
  audit("review_link.created", "project", projectId);
  return {
    token: `review_${projectId}`,
    url: `/review/review_${projectId}`,
  };
}

export function getDemoReview(token: string) {
  if (!token.startsWith("review_prj_")) return null;
  const projectId = token.slice("review_".length);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return null;
  return {
    organization: state.organization,
    brand: state.brands.find((item) => item.id === project.brandId),
    project,
    testCards: state.testCards.filter(
      (item) => item.projectId === project.id && item.state === "approved",
    ),
    storyboardFrames: state.storyboardFrames.filter((frame) =>
      state.testCards.some(
        (card) =>
          card.id === frame.testCardId &&
          card.projectId === project.id &&
          card.state === "approved",
      ),
    ),
  };
}

export async function produceApprovedDemoCards(
  organizationId: string,
  projectId: string,
) {
  requireDemoOrganization(organizationId);
  const approved = state.testCards.filter(
    (card) => card.projectId === projectId && card.state === "approved",
  );
  if (!approved.length) throw new Error("No approved Test Cards");
  const generations = [];
  for (const card of approved.slice(0, 3)) {
    generations.push(
      await createDemoGeneration(organizationId, {
        projectId,
        operation: "text_to_image",
        prompt: `${card.visualTreatment}. ${card.hook}. ${card.promise}`,
        modelId: "relay-image-pro",
        aspectRatio: "9:16",
        outputCount: 1,
        idempotencyKey: `produce:${projectId}:${card.id}:v1`,
      }),
    );
  }
  audit("project.production_started", "project", projectId, {
    generationCount: generations.length,
  });
  return generations;
}
