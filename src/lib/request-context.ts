import "server-only";

import { NextResponse } from "next/server";
import type { OrganizationRole } from "@/domain/types";
import {
  isDemoMode,
  sessionFromRequest,
  type SessionClaims,
} from "@/security/session";

export const DEMO_ORGANIZATION_ID = "org_demo";

type RateRecord = {
  count: number;
  resetsAt: number;
};

const globalSecurityState = globalThis as typeof globalThis & {
  __relayframeRateLimits?: Map<string, RateRecord>;
};
const rateLimits =
  (globalSecurityState.__relayframeRateLimits ??= new Map<string, RateRecord>());

export function requestContextFromRequest(
  request: Request,
  allowedRoles: OrganizationRole[] = [
    "owner",
    "admin",
    "creator",
    "reviewer",
  ],
): SessionClaims | null {
  const session = sessionFromRequest(request);
  if (!session || !allowedRoles.includes(session.role)) return null;
  return session;
}

export function organizationFromRequest(request: Request) {
  return requestContextFromRequest(request)?.organizationId ?? null;
}

export function apiError(
  message: string,
  status = 400,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...headers,
      },
    },
  );
}

function sourceIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  if (rateLimits.size > 10_000) {
    for (const [recordKey, record] of rateLimits) {
      if (record.resetsAt <= now) rateLimits.delete(recordKey);
    }
  }
  const existing = rateLimits.get(key);
  if (!existing || existing.resetsAt <= now) {
    rateLimits.set(key, { count: 1, resetsAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    retryAfter: Math.max(1, Math.ceil((existing.resetsAt - now) / 1_000)),
  };
}

export function enforceMutationSecurity(
  request: Request,
  options: {
    scope: string;
    limit?: number;
    windowMs?: number;
    maxBodyBytes?: number;
  },
) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  const maxBodyBytes = options.maxBodyBytes ?? 64 * 1024;
  if (
    !Number.isFinite(contentLength) ||
    contentLength < 0 ||
    contentLength > maxBodyBytes
  ) {
    return apiError("Request body is too large", 413);
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") {
    return apiError("Cross-site mutation rejected", 403);
  }

  const origin = request.headers.get("origin");
  if (origin) {
    const expected = new URL(request.url).origin;
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (origin !== expected && (!configured || origin !== configured)) {
      return apiError("Origin not allowed", 403);
    }
  } else if (!isDemoMode()) {
    return apiError("Origin header required", 403);
  }

  const session = sessionFromRequest(request);
  if (!session) return apiError("Authentication required", 401);
  const rate = consumeRateLimit(
    `${options.scope}:${session.organizationId}:${session.userId}:${sourceIp(request)}`,
    options.limit ?? 30,
    options.windowMs ?? 60_000,
  );
  if (!rate.allowed) {
    return apiError("Rate limit exceeded", 429, {
      "Retry-After": String(rate.retryAfter),
    });
  }
  return null;
}

export function resetSecurityRateLimitsForTests() {
  if (process.env.RELAYFRAME_E2E === "1" || process.env.NODE_ENV === "test") {
    rateLimits.clear();
  }
}

export class RequestBodyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}

export async function readBoundedJson(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<unknown> {
  if (!request.body) throw new RequestBodyError("Request body required", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RequestBodyError("Request body is too large", 413);
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(merged));
  } catch {
    throw new RequestBodyError("Request body must be valid JSON", 400);
  }
}
