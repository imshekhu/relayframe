import { NextResponse } from "next/server";
import { generationRequestSchema } from "@/domain/schemas";
import {
  createDemoGeneration,
  demoSnapshot,
  refreshDemoGenerations,
} from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  organizationFromRequest,
  requestContextFromRequest,
} from "@/lib/request-context";

export async function GET(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
  try {
    const snapshot = await refreshDemoGenerations(organizationId);
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
    body = await request.json();
  } catch {
    return apiError("Request body must be valid JSON");
  }
  const parsed = generationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid generation request",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }

  try {
    const generation = await createDemoGeneration(
      organizationId,
      parsed.data,
    );
    return NextResponse.json(
      { generation, availableCredits: demoSnapshot().availableCredits },
      { status: 202 },
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Generation failed",
      400,
    );
  }
}
