import { NextResponse } from "next/server";
import { createDemoReviewLink } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
  const { projectId } = await context.params;
  try {
    return NextResponse.json(
      createDemoReviewLink(organizationId, projectId),
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Review failed");
  }
}
