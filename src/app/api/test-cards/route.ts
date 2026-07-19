import { NextResponse } from "next/server";
import { testCardCreateSchema } from "@/domain/schemas";
import { createDemoTestCard } from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  requestContextFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    scope: "test-card:create",
    limit: 30,
  });
  if (guard) return guard;
  const context = requestContextFromRequest(request, [
    "owner",
    "admin",
    "creator",
  ]);
  if (!context) return apiError("Insufficient permission", 403);
  const organizationId = context.organizationId;
  const parsed = testCardCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError("Invalid Test Card", 422);
  try {
    return NextResponse.json(
      createDemoTestCard(organizationId, parsed.data),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Creation failed");
  }
}
