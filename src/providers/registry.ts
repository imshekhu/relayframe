import type { GenerationOperation } from "@/domain/types";
import { DemoGenerationProvider } from "./demo-provider";
import type { GenerationProvider } from "./types";

const demoProvider = new DemoGenerationProvider();

export const providers: GenerationProvider[] = [demoProvider];

export function listModelCapabilities() {
  return providers.flatMap((provider) => provider.capabilities());
}

export function resolveModel(modelId: string) {
  for (const provider of providers) {
    const capability = provider
      .capabilities()
      .find((model) => model.id === modelId && model.enabled);
    if (capability) return { provider, capability };
  }
  return null;
}

export function routeModel(
  operation: GenerationOperation,
  preference: "economy" | "quality" = "economy",
) {
  const candidates = listModelCapabilities().filter(
    (model) => model.enabled && model.operations.includes(operation),
  );
  return candidates.sort((a, b) => {
    if (preference === "quality") {
      const score = { economy: 0, standard: 1, premium: 2 };
      return score[b.qualityTier] - score[a.qualityTier];
    }
    return (
      a.baseCredits +
      a.creditPerOutput -
      (b.baseCredits + b.creditPerOutput)
    );
  })[0];
}
