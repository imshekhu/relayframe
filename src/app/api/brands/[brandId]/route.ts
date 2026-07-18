import { NextResponse } from "next/server";
import { brandUpdateSchema } from "@/domain/schemas";
import { updateDemoBrand } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
  const parsed = brandUpdateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError("Invalid brand update", 422);
  const { brandId } = await context.params;
  try {
    return NextResponse.json(
      updateDemoBrand(organizationId, brandId, parsed.data),
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Update failed");
  }
}
