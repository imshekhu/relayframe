import { NextResponse } from "next/server";
import { z } from "zod";
import { updateTestCardState } from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  requestContextFromRequest,
} from "@/lib/request-context";

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
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid Test Card update", 422);
  const { cardId } = await context.params;
  try {
    return NextResponse.json(
      updateTestCardState(organizationId, cardId, parsed.data.state),
    );
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : "Test Card update failed",
      404,
    );
  }
}
