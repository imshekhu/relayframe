import { NextResponse } from "next/server";
import { resetDemoState } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return apiError("Not found", 404);
  }
  const organizationId = organizationFromRequest(request);
  if (organizationId !== "org_demo") return apiError("Invalid organization", 401);
  return NextResponse.json(resetDemoState());
}
