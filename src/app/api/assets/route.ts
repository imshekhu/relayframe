import { NextResponse } from "next/server";
import { assetCreateSchema } from "@/domain/schemas";
import { createDemoAsset } from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  requestContextFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    scope: "asset:create",
    limit: 20,
  });
  if (guard) return guard;
  const context = requestContextFromRequest(request, [
    "owner",
    "admin",
    "creator",
  ]);
  if (!context) return apiError("Insufficient permission", 403);
  const organizationId = context.organizationId;
  const parsed = assetCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError("Invalid asset metadata", 422);
  try {
    return NextResponse.json(
      createDemoAsset(organizationId, parsed.data),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Upload failed");
  }
}
