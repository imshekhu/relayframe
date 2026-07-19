import { NextResponse } from "next/server";
import {
  apiError,
  enforceMutationSecurity,
  requestContextFromRequest,
} from "@/lib/request-context";
import { isDemoMode } from "@/security/session";
import { workspaceService } from "@/services/workspace-service";

export async function POST(request: Request) {
  if (!isDemoMode()) return apiError("Not found", 404);
  const guard = enforceMutationSecurity(request, {
    scope: "demo-generation-sync",
    limit: 90,
    windowMs: 60_000,
  });
  if (guard) return guard;
  const context = requestContextFromRequest(request);
  if (!context) return apiError("Authentication required", 401);
  return NextResponse.json(
    await workspaceService.syncGenerations(context.organizationId),
    { headers: { "Cache-Control": "no-store" } },
  );
}
