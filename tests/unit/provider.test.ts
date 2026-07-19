import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoGenerationProvider } from "@/providers/demo-provider";

describe("demo provider adapter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is idempotent and normalizes an asynchronous provider lifecycle", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const provider = new DemoGenerationProvider();
    const request = {
      generationId: "gen_provider_test",
      modelId: "relay-image-fast",
      operation: "text_to_image" as const,
      prompt: "A premium editorial product photograph",
      aspectRatio: "4:5",
      outputCount: 2,
      inputAssetUrls: [],
      maxCostCredits: 100,
    };
    const first = await provider.submit(request, "provider-idempotency-test");
    const duplicate = await provider.submit(
      request,
      "provider-idempotency-test",
    );
    expect(duplicate.providerJobId).toBe(first.providerJobId);
    expect(first.state).toBe("submitted");

    vi.advanceTimersByTime(6_000);
    const completed = await provider.status(first.providerJobId);
    expect(completed.state).toBe("succeeded");
    expect(completed.outputUrls).toHaveLength(2);
    expect(completed.actualCostCredits).toBeGreaterThan(0);
  });

  it("rejects unsupported provider constraints", () => {
    const provider = new DemoGenerationProvider();
    expect(() =>
      provider.validate({
        generationId: "gen_bad",
        modelId: "relay-motion",
        operation: "text_to_video",
        prompt: "A valid but unsupported request",
        aspectRatio: "4:5",
        outputCount: 1,
        inputAssetUrls: [],
        maxCostCredits: 100,
      }),
    ).toThrow("Unsupported aspect ratio");
  });
});
