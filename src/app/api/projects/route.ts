import { NextResponse } from "next/server";
import { projectCreateSchema } from "@/domain/schemas";
import { createDemoProject } from "@/lib/demo-store";
import {
  apiError,
  organizationFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  const organizationId = organizationFromRequest(request);
  if (!organizationId) return apiError("Invalid organization", 401);
  const parsed = projectCreateSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return apiError("Invalid project", 422);
  try {
    return NextResponse.json(
      createDemoProject(organizationId, parsed.data),
      { status: 201 },
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Project failed");
  }
}
