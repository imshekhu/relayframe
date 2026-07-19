import { NextResponse } from "next/server";
import { projectCreateSchema } from "@/domain/schemas";
import { createDemoProject } from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  requestContextFromRequest,
} from "@/lib/request-context";

export async function POST(request: Request) {
  const guard = enforceMutationSecurity(request, {
    scope: "project:create",
    limit: 10,
  });
  if (guard) return guard;
  const context = requestContextFromRequest(request, [
    "owner",
    "admin",
    "creator",
  ]);
  if (!context) return apiError("Insufficient permission", 403);
  const organizationId = context.organizationId;
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
