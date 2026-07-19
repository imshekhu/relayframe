import { NextResponse } from "next/server";
import { z } from "zod";
import {
  apiError,
  enforceMutationSecurity,
  readBoundedJson,
  RequestBodyError,
  requestContextFromRequest,
} from "@/lib/request-context";
import { workspaceService } from "@/services/workspace-service";

const updateSchema = z.object({
  state: z.enum(["draft", "approved", "rejected"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ cardId: string }> },
) {
  const guard = enforceMutationSecurity(request, {
    scope: "test-card:update",
    limit: 40,
  });
  if (guard) return guard;
  const session = requestContextFromRequest(request, [
    "owner",
    "admin",
    "creator",
    "reviewer",
  ]);
  if (!session) return apiError("Insufficient permission", 403);
  const organizationId = session.organizationId;
  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    return error instanceof RequestBodyError
      ? apiError(error.message, error.status)
      : apiError("Invalid request body");
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid Test Card update", 422);
  const { cardId } = await context.params;
  try {
    return NextResponse.json(
      workspaceService.updateTestCard(
        organizationId,
        cardId,
        parsed.data.state,
      ),
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Test Card update failed",
      404,
    );
  }
}
