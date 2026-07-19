import { NextResponse } from "next/server";
import { creditTopUpSchema } from "@/domain/schemas";
import {
  apiError,
  enforceMutationSecurity,
  readBoundedJson,
  RequestBodyError,
  requestContextFromRequest,
} from "@/lib/request-context";
import { isDemoMode } from "@/security/session";
import { workspaceService } from "@/services/workspace-service";

export async function POST(request: Request) {
  if (!isDemoMode()) return apiError("Not found", 404);
  const guard = enforceMutationSecurity(request, {
    scope: "demo-credit-top-up",
    limit: 3,
    windowMs: 60_000,
  });
  if (guard) return guard;
  const context = requestContextFromRequest(request, ["owner", "admin"]);
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
  const parsed = creditTopUpSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid credit package", 422);
  try {
    return NextResponse.json(
      workspaceService.topUpCredits(organizationId, parsed.data.amount),
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Top-up failed");
  }
}
