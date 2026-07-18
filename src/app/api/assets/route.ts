import { NextResponse } from "next/server";
import { assetCreateSchema } from "@/domain/schemas";
import { createDemoAsset } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
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
