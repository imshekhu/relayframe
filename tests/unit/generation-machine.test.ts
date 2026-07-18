import { describe, expect, it } from "vitest";
import {
  InvalidGenerationTransition,
  assertGenerationTransition,
  canTransition,
  generationProgress,
  isTerminalGenerationState,
} from "@/domain/generation-machine";

describe("generation state machine", () => {
  it("accepts the complete successful lifecycle", () => {
    const states = [
      "created",
      "validating",
      "safety_precheck",
      "cost_reserved",
      "queued",
      "provider_running",
      "media_processing",
      "safety_postcheck",
      "publishing",
      "completed",
    ] as const;
    for (let index = 0; index < states.length - 1; index += 1) {
      expect(canTransition(states[index], states[index + 1])).toBe(true);
      expect(generationProgress(states[index + 1])).toBeGreaterThan(
        generationProgress(states[index]),
      );
    }
    expect(isTerminalGenerationState("completed")).toBe(true);
  });

  it("rejects regression and terminal transitions", () => {
    expect(() =>
      assertGenerationTransition("provider_running", "created"),
    ).toThrow(InvalidGenerationTransition);
    expect(() =>
      assertGenerationTransition("completed", "provider_running"),
    ).toThrow(InvalidGenerationTransition);
  });
});
