import { NextResponse } from "next/server";
import { creditTopUpSchema } from "@/domain/schemas";
import { topUpDemoCredits } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
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
