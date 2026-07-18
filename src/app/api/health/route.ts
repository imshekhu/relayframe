import { NextResponse } from "next/server";
import { listModelCapabilities } from "@/providers/registry";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "relayframe-control-plane",
    version: 1,
    providers: 1,
    models: listModelCapabilities().length,
    demoMode: true,
    timestamp: new Date().toISOString(),
  });
}
