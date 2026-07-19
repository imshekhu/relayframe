import { NextResponse } from "next/server";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";
import { workspaceService } from "@/services/workspace-service";

export async function GET(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
  try {
    return NextResponse.json(workspaceService.snapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return apiError("Organization not found", 404);
  }
}
