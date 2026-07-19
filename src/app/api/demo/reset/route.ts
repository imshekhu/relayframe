import { NextResponse } from "next/server";
import { resetDemoState } from "@/lib/demo-store";
import {
  apiError,
  resetSecurityRateLimitsForTests,
} from "@/lib/request-context";

export async function POST(request: Request) {
  if (
    process.env.RELAYFRAME_E2E !== "1" ||
    !process.env.RELAYFRAME_E2E_TOKEN ||
    request.headers.get("x-relayframe-test-token") !==
      process.env.RELAYFRAME_E2E_TOKEN
  ) {
    return apiError("Not found", 404);
  }
  resetSecurityRateLimitsForTests();
  return NextResponse.json(resetDemoState());
}
