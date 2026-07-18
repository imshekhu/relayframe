import { describe, expect, it } from "vitest";
import {
  generationRequestSchema,
  organizationIdSchema,
} from "@/domain/schemas";

describe("API validation boundaries", () => {
  it("accepts a canonical bounded generation request", () => {
    expect(
      generationRequestSchema.safeParse({
        projectId: "prj_test",
        operation: "text_to_image",
        prompt: "A premium product photograph in calm natural light",
        modelId: "relay-image-fast",
        aspectRatio: "4:5",
        outputCount: 2,
        idempotencyKey: "request-12345678",
      }).success,
    ).toBe(true);
  });

  it("rejects unbounded output and malformed tenancy", () => {
    expect(
      generationRequestSchema.safeParse({
        operation: "text_to_image",
        prompt: "short",
        modelId: "relay-image-fast",
        aspectRatio: "3:2",
        outputCount: 100,
        idempotencyKey: "x",
      }).success,
    ).toBe(false);
    expect(organizationIdSchema.safeParse("../../other-tenant").success).toBe(
      false,
    );
  });
});
