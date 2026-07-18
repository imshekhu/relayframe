import { NextResponse } from "next/server";
import {
  demoSnapshot,
  refreshDemoGenerations,
} from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function GET(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
  try {
    await refreshDemoGenerations(organizationId);
    return NextResponse.json(demoSnapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return apiError("Organization not found", 404);
  }
}
