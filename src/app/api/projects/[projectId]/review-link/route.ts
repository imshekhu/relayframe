import { NextResponse } from "next/server";
import { createDemoReviewLink } from "@/lib/demo-store";
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
    scope: "review-link:create",
    limit: 10,
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
    return NextResponse.json(
      createDemoReviewLink(organizationId, projectId),
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Review failed");
  }
}
