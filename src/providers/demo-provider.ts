import type { ModelCapability } from "@/domain/types";
import type {
  CanonicalGenerationRequest,
  GenerationProvider,
  ProviderJob,
} from "./types";

const capabilities: ModelCapability[] = [
  {
    id: "relay-image-fast",
    provider: "relay-demo",
    displayName: "Relay Image Fast",
    operations: ["text_to_image", "image_to_image"],
    aspectRatios: ["1:1", "4:5", "9:16", "16:9"],
    maxOutputs: 4,
    supportsReferences: true,
    supportsAudio: false,
    commercialUse: true,
    estimatedLatencySeconds: [3, 7],
    baseCredits: 4,
    creditPerOutput: 3,
    qualityTier: "economy",
    enabled: true,
  },
  {
    id: "relay-image-pro",
    provider: "relay-demo",
    displayName: "Relay Image Pro",
    operations: ["text_to_image", "image_to_image"],
    aspectRatios: ["1:1", "4:5", "9:16", "16:9"],
    maxOutputs: 4,
    supportsReferences: true,
    supportsAudio: false,
    commercialUse: true,
    estimatedLatencySeconds: [6, 12],
    baseCredits: 8,
    creditPerOutput: 5,
    qualityTier: "premium",
    enabled: true,
  },
  {
    id: "relay-motion",
    provider: "relay-demo",
    displayName: "Relay Motion",
    operations: ["text_to_video", "image_to_video"],
    aspectRatios: ["1:1", "9:16", "16:9"],
    maxOutputs: 2,
    supportsReferences: true,
    supportsAudio: true,
    commercialUse: true,
    estimatedLatencySeconds: [12, 28],
    baseCredits: 14,
    creditPerOutput: 10,
    qualityTier: "standard",
    enabled: true,
  },
];

type StoredDemoJob = ProviderJob & {
  createdAt: number;
  request: CanonicalGenerationRequest;
};

const globalJobs = globalThis as typeof globalThis & {
  __relayDemoJobs?: Map<string, StoredDemoJob>;
};
const jobs = (globalJobs.__relayDemoJobs ??= new Map());

export class DemoGenerationProvider implements GenerationProvider {
  readonly id = "relay-demo";
  readonly name = "RelayFrame Demo Provider";

  capabilities() {
    return capabilities;
  }

  validate(request: CanonicalGenerationRequest) {
    const capability = capabilities.find((item) =>
      item.operations.includes(request.operation),
    );
    if (!capability) throw new Error("Unsupported demo operation");
    if (!capability.aspectRatios.includes(request.aspectRatio)) {
      throw new Error("Unsupported aspect ratio");
    }
    if (request.outputCount > capability.maxOutputs) {
      throw new Error("Too many outputs requested");
    }
  }

  quote(request: CanonicalGenerationRequest) {
    return request.operation.includes("video")
      ? 18 + request.outputCount * 9
      : 5 + request.outputCount * 3;
  }

  async submit(
    request: CanonicalGenerationRequest,
    idempotencyToken: string,
  ) {
    this.validate(request);
    const existing = jobs.get(idempotencyToken);
    if (existing) return this.normalize(existing);
    const job: StoredDemoJob = {
      providerJobId: idempotencyToken,
      state: "submitted",
      progress: 5,
      outputUrls: [],
      createdAt: Date.now(),
      request,
    };
    jobs.set(idempotencyToken, job);
    return this.normalize(job);
  }

  async status(providerJobId: string) {
    const job = jobs.get(providerJobId);
    if (!job) throw new Error("Demo provider job not found");
    const elapsed = Date.now() - job.createdAt;
    if (elapsed > 5_500) {
      job.state = "succeeded";
      job.progress = 100;
      job.outputUrls = Array.from(
        { length: job.request.outputCount },
        (_, index) =>
          `/api/demo-output/${job.request.generationId}/${index}`,
      );
      job.actualCostCredits = this.quote(job.request);
    } else if (elapsed > 800) {
      job.state = "running";
      job.progress = Math.min(92, 15 + Math.floor(elapsed / 70));
    }
    return this.normalize(job);
  }

  async cancel(providerJobId: string) {
    const job = jobs.get(providerJobId);
    if (job && !["succeeded", "failed"].includes(job.state)) {
      job.state = "cancelled";
      job.progress = 100;
    }
  }

  private normalize(job: StoredDemoJob): ProviderJob {
    return {
      providerJobId: job.providerJobId,
      state: job.state,
      progress: job.progress,
      outputUrls: [...job.outputUrls],
      actualCostCredits: job.actualCostCredits,
      errorCode: job.errorCode,
    };
  }
}
