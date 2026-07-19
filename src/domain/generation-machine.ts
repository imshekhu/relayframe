import type { GenerationState } from "./types";

const allowedTransitions: Record<GenerationState, GenerationState[]> = {
  created: ["validating", "cancelled"],
  validating: ["safety_precheck", "rejected", "failed", "cancelled"],
  safety_precheck: ["cost_reserved", "rejected", "failed", "cancelled"],
  cost_reserved: ["queued", "failed", "cancelled"],
  queued: ["provider_running", "failed", "cancelled"],
  provider_running: ["media_processing", "failed", "cancelled"],
  media_processing: ["safety_postcheck", "failed", "cancelled"],
  safety_postcheck: ["publishing", "rejected", "failed"],
  publishing: ["completed", "failed"],
  completed: [],
  rejected: [],
  failed: [],
  cancelled: [],
};

export class InvalidGenerationTransition extends Error {
  constructor(from: GenerationState, to: GenerationState) {
    super(`Invalid generation transition: ${from} → ${to}`);
    this.name = "InvalidGenerationTransition";
  }
}

export function canTransition(
  from: GenerationState,
  to: GenerationState,
) {
  return allowedTransitions[from].includes(to);
}

export function assertGenerationTransition(
  from: GenerationState,
  to: GenerationState,
) {
  if (!canTransition(from, to)) {
    throw new InvalidGenerationTransition(from, to);
  }
}

export function isTerminalGenerationState(state: GenerationState) {
  return ["completed", "rejected", "failed", "cancelled"].includes(state);
}

export function generationProgress(state: GenerationState) {
  const progress: Record<GenerationState, number> = {
    created: 2,
    validating: 8,
    safety_precheck: 15,
    cost_reserved: 22,
    queued: 30,
    provider_running: 58,
    media_processing: 76,
    safety_postcheck: 84,
    publishing: 94,
    completed: 100,
    rejected: 100,
    failed: 100,
    cancelled: 100,
  };
  return progress[state];
}
