import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDemoGeneration,
  demoSnapshot,
  refreshDemoGenerations,
  resetDemoState,
} from "@/lib/demo-store";

describe("active generation application service", () => {
  afterEach(() => {
    vi.useRealTimers();
    resetDemoState();
  });

  it("routes Auto, enforces idempotency payloads, transitions, and settles once", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-19T12:00:00Z"));
    resetDemoState();
    const request = {
      projectId: "prj_luma-launch",
      operation: "text_to_image" as const,
      prompt: "Premium product portrait with restrained editorial lighting",
      modelId: "auto",
      aspectRatio: "4:5" as const,
      outputCount: 2,
      idempotencyKey: "generation-service-test-key",
    };
    const generation = await createDemoGeneration("org_demo", request);
    expect(generation.modelId).toBe("relay-image-fast");
    expect(generation.state).toBe("provider_running");
    expect(demoSnapshot().availableCredits).toBeLessThan(1_250);

    const duplicate = await createDemoGeneration("org_demo", request);
    expect(duplicate.id).toBe(generation.id);
    await expect(
      createDemoGeneration("org_demo", {
        ...request,
        prompt: "A materially different request under the same key",
      }),
    ).rejects.toThrow("Idempotency key reused");

    vi.advanceTimersByTime(6_000);
    await refreshDemoGenerations("org_demo");
    const completed = demoSnapshot().generations.find(
      (item) => item.id === generation.id,
    );
    expect(completed?.state).toBe("completed");
    expect(completed?.progress).toBe(100);
    expect(completed?.outputAssetIds).toHaveLength(2);
    const balanceAfterFirstSettlement = demoSnapshot().availableCredits;

    await refreshDemoGenerations("org_demo");
    expect(demoSnapshot().availableCredits).toBe(balanceAfterFirstSettlement);
    expect(
      demoSnapshot().ledger.filter(
        (entry) =>
          entry.generationId === generation.id &&
          entry.type === "consumption",
      ),
    ).toHaveLength(1);
  });

  it("rejects cross-project tenancy and project budget overflow before reservation", async () => {
    resetDemoState();
    await expect(
      createDemoGeneration("org_demo", {
        projectId: "prj_missing",
        operation: "text_to_image",
        prompt: "A valid prompt that must not reserve any credits",
        modelId: "auto",
        aspectRatio: "4:5",
        outputCount: 1,
        idempotencyKey: "missing-project-test",
      }),
    ).rejects.toThrow("Project not found");
    expect(demoSnapshot().availableCredits).toBe(1_250);
  });
});
