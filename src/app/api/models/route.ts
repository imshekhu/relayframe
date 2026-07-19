import { NextResponse } from "next/server";
import { listModelCapabilities } from "@/providers/registry";

export async function GET() {
  return NextResponse.json(
    { models: listModelCapabilities().filter((model) => model.enabled) },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
