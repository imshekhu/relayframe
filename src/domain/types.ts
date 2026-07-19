export type ID = string;

export type OrganizationRole =
  | "owner"
  | "admin"
  | "creator"
  | "reviewer";

export type ProjectState =
  | "draft"
  | "strategy_review"
  | "storyboard_review"
  | "production"
  | "client_review"
  | "exported"
  | "results_imported"
  | "archived";

export type TestCardState = "draft" | "approved" | "rejected";

export type GenerationState =
  | "created"
  | "validating"
  | "safety_precheck"
  | "cost_reserved"
  | "queued"
  | "provider_running"
  | "media_processing"
  | "safety_postcheck"
  | "publishing"
  | "completed"
  | "rejected"
  | "failed"
  | "cancelled";

export type GenerationOperation =
  | "text_to_image"
  | "image_to_image"
  | "text_to_video"
  | "image_to_video";

export type LedgerEntryType =
  | "grant"
  | "purchase"
  | "reservation"
  | "consumption"
  | "release"
  | "refund";

export interface Organization {
  id: ID;
  name: string;
  slug: string;
  plan: "trial" | "studio" | "agency" | "scale";
  createdAt: string;
}

export interface Brand {
  id: ID;
  organizationId: ID;
  name: string;
  website: string;
  description: string;
  colors: string[];
  tone: string[];
  audiences: string[];
  approvedClaims: string[];
  prohibitedClaims: string[];
  requiredDisclaimers: string[];
  version: number;
  updatedAt: string;
}

export interface Project {
  id: ID;
  organizationId: ID;
  brandId: ID;
  name: string;
  objective: string;
  state: ProjectState;
  aspectRatios: string[];
  budgetCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeBrief {
  id: ID;
  projectId: ID;
  product: string;
  campaignObjective: string;
  audience: string;
  offer: string;
  emotion: string;
  placement: string;
  constraints: string[];
  createdAt: string;
}

export interface TestCard {
  id: ID;
  projectId: ID;
  strategy:
    | "problem_solution"
    | "demonstration"
    | "objection"
    | "social_proof"
    | "comparison"
    | "urgency";
  title: string;
  audience: string;
  hook: string;
  promise: string;
  proof: string;
  offer: string;
  visualTreatment: string;
  changedVariable: string;
  heldConstants: string[];
  state: TestCardState;
}

export interface StoryboardFrame {
  id: ID;
  testCardId: ID;
  ordinal: number;
  shot: string;
  overlay: string;
  camera: string;
  imageUrl?: string;
  approval: "pending" | "approved" | "rejected";
}

export interface Asset {
  id: ID;
  organizationId: ID;
  projectId?: ID;
  parentAssetId?: ID;
  type: "image" | "video" | "logo" | "reference";
  name: string;
  url: string;
  width: number;
  height: number;
  durationMs?: number;
  status: "quarantined" | "active" | "rejected";
  generationId?: ID;
  createdAt: string;
}

export interface Generation {
  id: ID;
  organizationId: ID;
  projectId?: ID;
  operation: GenerationOperation;
  prompt: string;
  modelId: string;
  aspectRatio: string;
  outputCount: number;
  state: GenerationState;
  estimatedCredits: number;
  reservedCredits: number;
  consumedCredits: number;
  progress: number;
  error?: string;
  outputAssetIds: ID[];
  createdAt: string;
  completedAt?: string;
}

export interface LedgerEntry {
  id: ID;
  organizationId: ID;
  generationId?: ID;
  type: LedgerEntryType;
  amount: number;
  idempotencyKey: string;
  createdAt: string;
}

export interface AuditEvent {
  id: ID;
  organizationId: ID;
  actorId: ID;
  action: string;
  entityType: string;
  entityId: ID;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ModelCapability {
  id: string;
  provider: string;
  displayName: string;
  operations: GenerationOperation[];
  aspectRatios: string[];
  maxOutputs: number;
  supportsReferences: boolean;
  supportsAudio: boolean;
  commercialUse: boolean;
  estimatedLatencySeconds: [number, number];
  baseCredits: number;
  creditPerOutput: number;
  qualityTier: "economy" | "standard" | "premium";
  enabled: boolean;
}
