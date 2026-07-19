import { NextResponse } from "next/server";
import { testCardCreateSchema } from "@/domain/schemas";
import {
  apiError,
  enforceMutationSecurity,
  readBoundedJson,
  RequestBodyError,
  requestContextFromRequest,
} from "@/lib/request-context";
import { workspaceService } from "@/services/workspace-service";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    scope: "test-card:create",
    limit: 30,
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
    body = await readBoundedJson(request);
  } catch (error) {
    return error instanceof RequestBodyError
      ? apiError(error.message, error.status)
      : apiError("Invalid request body");
  }
  const parsed = testCardCreateSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid Test Card", 422);
  try {
    return NextResponse.json(
      workspaceService.createTestCard(organizationId, parsed.data),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Creation failed");
  }
}
