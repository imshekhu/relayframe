import { NextResponse } from "next/server";
import { organizationIdSchema } from "@/domain/schemas";

export const DEMO_ORGANIZATION_ID = "org_demo";

export function organizationFromRequest(request: Request) {
  const raw =
    request.headers.get("x-relayframe-organization") ??
    DEMO_ORGANIZATION_ID;
  const parsed = organizationIdSchema.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
