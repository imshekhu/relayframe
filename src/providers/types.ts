import type {
  GenerationOperation,
  ModelCapability,
} from "@/domain/types";

export interface CanonicalGenerationRequest {
  generationId: string;
  operation: GenerationOperation;
  prompt: string;
  aspectRatio: string;
  outputCount: number;
  inputAssetUrls: string[];
  maxCostCredits: number;
}

export type ProviderJobState =
  | "submitted"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface ProviderJob {
  providerJobId: string;
  state: ProviderJobState;
  progress: number;
  outputUrls: string[];
  actualCostCredits?: number;
  errorCode?: string;
}

export interface GenerationProvider {
  id: string;
  name: string;
  capabilities(): ModelCapability[];
  validate(request: CanonicalGenerationRequest): void;
  quote(request: CanonicalGenerationRequest): number;
  submit(
    request: CanonicalGenerationRequest,
    idempotencyToken: string,
  ): Promise<ProviderJob>;
  status(providerJobId: string): Promise<ProviderJob>;
  cancel(providerJobId: string): Promise<void>;
}
