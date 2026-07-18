import { NextResponse } from "next/server";
import { testCardCreateSchema } from "@/domain/schemas";
import { createDemoTestCard } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
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
