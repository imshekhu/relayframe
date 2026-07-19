import { NextResponse } from "next/server";
import { brandUpdateSchema } from "@/domain/schemas";
import { updateDemoBrand } from "@/lib/demo-store";
import {
  apiError,
  enforceMutationSecurity,
  readBoundedJson,
  RequestBodyError,
  requestContextFromRequest,
} from "@/lib/request-context";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ brandId: string }> },
) {
  const guard = enforceMutationSecurity(request, {
    scope: "brand:update",
    limit: 10,
  });
  if (guard) return guard;
  const authContext = requestContextFromRequest(request, ["owner", "admin"]);
  if (!authContext) return apiError("Insufficient permission", 403);
  const organizationId = authContext.organizationId;
  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    return error instanceof RequestBodyError
      ? apiError(error.message, error.status)
      : apiError("Invalid request body");
  }
  const parsed = brandUpdateSchema.safeParse(body);
  if (!parsed.success) return apiError("Invalid brand update", 422);
  const { brandId } = await context.params;
  try {
    return NextResponse.json(
      updateDemoBrand(organizationId, brandId, parsed.data),
    );
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Update failed");
  }
}
