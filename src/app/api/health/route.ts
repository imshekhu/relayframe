import { NextResponse } from "next/server";
import { listModelCapabilities } from "@/providers/registry";
import { securityReadiness } from "@/security/environment";

export async function GET() {
  const security = securityReadiness();
  return NextResponse.json({
    ok: security.ready,
    service: "relayframe-control-plane",
    version: 1,
    providers: 1,
    models: listModelCapabilities().length,
    mode: security.mode,
    securityReady: security.ready,
    configurationIssueCount: security.missing.length,
    timestamp: new Date().toISOString(),
  }, { status: security.ready ? 200 : 503 });
}
