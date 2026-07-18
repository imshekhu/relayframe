import { NextResponse } from "next/server";
import { produceApprovedDemoCards } from "@/lib/demo-store";
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
    const generations = await produceApprovedDemoCards(
      organizationId,
      projectId,
    );
    return NextResponse.json({ generations }, { status: 202 });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Production failed");
  }
}
