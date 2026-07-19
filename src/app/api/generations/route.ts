import { NextResponse } from "next/server";
import { generationRequestSchema } from "@/domain/schemas";
import {
  apiError,
  applicationErrorResponse,
  enforceMutationSecurity,
  organizationFromRequest,
  readBoundedJson,
  RequestBodyError,
  requestContextFromRequest,
} from "@/lib/request-context";
import { workspaceService } from "@/services/workspace-service";
import { logDomainEvent } from "@/lib/observability";

export async function GET(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
  try {
    const snapshot = workspaceService.snapshot();
    return NextResponse.json({
      generations: snapshot.generations,
      assets: snapshot.assets,
      availableCredits: snapshot.availableCredits,
    });
  } catch {
    return apiError("Organization not found", 404);
  }
}

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    scope: "generation:create",
    limit: 8,
    windowMs: 60_000,
    maxBodyBytes: 96 * 1024,
  });
  if (guard) return guard;
  const context = requestContextFromRequest(request, [
    "owner",
    "admin",
    "creator",
  ]);
  if (!context) return apiError("Insufficient permission", 403);
  const organizationId = context.organizationId;
  let body: unknown;
  try {
    body = await readBoundedJson(request, 96 * 1024);
  } catch (error) {
    return error instanceof RequestBodyError
      ? apiError(error.message, error.status)
      : apiError("Request body must be valid JSON");
  }
  const parsed = generationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "Invalid generation request",
      422,
      undefined,
      "VALIDATION_FAILED",
      {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
    );
  }

  try {
    const generation = await workspaceService.createGeneration(
      organizationId,
      parsed.data,
    );
    logDomainEvent("info", "generation.accepted", {
      organizationId,
      generationId: generation.id,
      modelId: generation.modelId,
      operation: generation.operation,
      reservedCredits: generation.reservedCredits,
    });
    return NextResponse.json(
      {
        generation,
        availableCredits: workspaceService.snapshot().availableCredits,
      },
      { status: 202 },
    );
  } catch (error) {
    logDomainEvent("warn", "generation.rejected", {
      organizationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return applicationErrorResponse(error);
  }
}
