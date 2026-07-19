import { NextResponse } from "next/server";
import { creditTopUpSchema } from "@/domain/schemas";
import { topUpDemoCredits } from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  requestContextFromRequest,
} from "@/lib/request-context";
import { isDemoMode } from "@/security/session";

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
  const parsed = creditTopUpSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError("Invalid credit package", 422);
  try {
    return NextResponse.json(
      topUpDemoCredits(organizationId, parsed.data.amount),
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Top-up failed");
  }
}
