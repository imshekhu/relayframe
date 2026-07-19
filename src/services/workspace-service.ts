import "server-only";

import type { GenerationRequest } from "@/domain/schemas";
import type { Asset, Brand, TestCard } from "@/domain/types";
import {
  createDemoAsset,
  createDemoGeneration,
  createDemoProject,
  createDemoReviewLink,
  createDemoTestCard,
  demoSnapshot,
  produceApprovedDemoCards,
  refreshDemoGenerations,
  getDemoReview,
  topUpDemoCredits,
  updateDemoBrand,
  updateTestCardState,
} from "@/lib/demo-store";

export class WorkspaceService {
  snapshot() {
    return demoSnapshot();
  }

  createProject(
    organizationId: string,
    input: { name: string; objective: string; budgetCredits: number },
  ) {
    return createDemoProject(organizationId, input);
  }

  createAsset(
    organizationId: string,
    input: { name: string; type: Asset["type"]; projectId?: string },
  ) {
    return createDemoAsset(organizationId, input);
  }

  createTestCard(
    organizationId: string,
    input: {
      projectId: string;
      strategy: TestCard["strategy"];
      title: string;
      hook: string;
    },
  ) {
    return createDemoTestCard(organizationId, input);
  }

  updateTestCard(
    organizationId: string,
    cardId: string,
    state: TestCard["state"],
  ) {
    return updateTestCardState(organizationId, cardId, state);
  }

  createGeneration(organizationId: string, request: GenerationRequest) {
    return createDemoGeneration(organizationId, request);
  }

  syncGenerations(organizationId: string) {
    return refreshDemoGenerations(organizationId);
  }

  produceProject(organizationId: string, projectId: string) {
    return produceApprovedDemoCards(organizationId, projectId);
  }

  createReviewLink(organizationId: string, projectId: string) {
    return createDemoReviewLink(organizationId, projectId);
  }

  review(token: string) {
    return getDemoReview(token);
  }

  updateBrand(
    organizationId: string,
    brandId: string,
    input: { description: string; tone: string[] },
  ): Brand {
    return updateDemoBrand(organizationId, brandId, input);
  }

  topUpCredits(organizationId: string, amount: number) {
    return topUpDemoCredits(organizationId, amount);
  }
}

export const workspaceService = new WorkspaceService();
