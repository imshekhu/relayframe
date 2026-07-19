import { NextResponse } from "next/server";
import { produceApprovedDemoCards } from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  requestContextFromRequest,
} from "@/lib/request-context";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const guard = enforceMutationSecurity(request, {
    scope: "project:produce",
    limit: 5,
    windowMs: 60_000,
  });
  if (guard) return guard;
  const authContext = requestContextFromRequest(request, [
    "owner",
    "admin",
    "creator",
  ]);
  if (!authContext) return apiError("Insufficient permission", 403);
  const organizationId = authContext.organizationId;
  const { projectId } = await context.params;
  try {
    const generations = await produceApprovedDemoCards(
      organizationId,
      projectId,
    );
    return NextResponse.json({ generations }, { status: 202 });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Production failed");
  }
}
