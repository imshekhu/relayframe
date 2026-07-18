import { NextResponse } from "next/server";
import { z } from "zod";
import { updateTestCardState } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

const updateSchema = z.object({
  state: z.enum(["draft", "approved", "rejected"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ cardId: string }> },
) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
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
