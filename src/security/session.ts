import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { OrganizationRole } from "@/domain/types";

export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-relayframe_session"
    : "relayframe_session";

export interface SessionClaims {
  version: 1;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
}

const roles: OrganizationRole[] = [
  "owner",
  "admin",
  "creator",
  "reviewer",
];

export function isDemoMode() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.RELAYFRAME_DEMO_MODE === "true" ||
    process.env.RELAYFRAME_E2E === "1"
  );
}

function sessionSecret() {
  const configured = process.env.SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (isDemoMode()) {
    return "relayframe-local-demo-session-secret-not-for-production";
  }
  throw new Error(
    "SESSION_SECRET must contain at least 32 characters in production",
  );
}

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest();
}

export function issueSessionToken(
  input: Pick<SessionClaims, "userId" | "organizationId" | "role">,
  lifetimeSeconds = 60 * 60 * 8,
) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = {
    version: 1,
    ...input,
    issuedAt,
    expiresAt: issuedAt + lifetimeSeconds,
    sessionId: randomBytes(18).toString("base64url"),
  };
  const payload = encode(JSON.stringify(claims));
  return `${payload}.${encode(sign(payload))}`;
}

export function verifySessionToken(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionClaims | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  let received: Buffer;
  try {
    received = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  const expected = sign(payload);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null;
  }
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<SessionClaims>;
    if (
      claims.version !== 1 ||
      typeof claims.userId !== "string" ||
      typeof claims.organizationId !== "string" ||
      typeof claims.role !== "string" ||
      !roles.includes(claims.role as OrganizationRole) ||
      typeof claims.issuedAt !== "number" ||
      typeof claims.expiresAt !== "number" ||
      typeof claims.sessionId !== "string" ||
      claims.issuedAt > nowSeconds + 60 ||
      claims.expiresAt <= nowSeconds ||
      claims.expiresAt - claims.issuedAt > 60 * 60 * 24
    ) {
      return null;
    }
    return claims as SessionClaims;
  } catch {
    return null;
  }
}

export function sessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = new Map(
    cookieHeader.split(";").flatMap((pair) => {
      const separator = pair.indexOf("=");
      if (separator < 1) return [];
      let value: string;
      try {
        value = decodeURIComponent(pair.slice(separator + 1).trim());
      } catch {
        return [];
      }
      return [
        [
          pair.slice(0, separator).trim(),
          value,
        ] as const,
      ];
    }),
  );
  const token = cookies.get(SESSION_COOKIE);
  if (token) return verifySessionToken(token);

  if (isDemoMode()) {
    return {
      version: 1,
      userId: "usr_demo",
      organizationId: "org_demo",
      role: "owner",
      issuedAt: 0,
      expiresAt: Number.MAX_SAFE_INTEGER,
      sessionId: "local-demo-session",
    } satisfies SessionClaims;
  }
  return null;
}

export function hashCapabilityToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

interface ReviewTokenClaims {
  type: "review";
  organizationId: string;
  projectId: string;
  expiresAt: number;
  nonce: string;
}

export function issueReviewToken(
  organizationId: string,
  projectId: string,
  lifetimeSeconds = 7 * 86_400,
) {
  const claims: ReviewTokenClaims = {
    type: "review",
    organizationId,
    projectId,
    expiresAt: Math.floor(Date.now() / 1_000) + lifetimeSeconds,
    nonce: randomBytes(18).toString("base64url"),
  };
  const payload = encode(JSON.stringify(claims));
  return `${payload}.${encode(sign(`review:${payload}`))}`;
}

export function verifyReviewToken(
  token: string,
  nowSeconds = Math.floor(Date.now() / 1_000),
): ReviewTokenClaims | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const received = Buffer.from(signature, "base64url");
  const expected = sign(`review:${payload}`);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  ) {
    return null;
  }
  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<ReviewTokenClaims>;
    if (
      claims.type !== "review" ||
      typeof claims.organizationId !== "string" ||
      typeof claims.projectId !== "string" ||
      typeof claims.expiresAt !== "number" ||
      typeof claims.nonce !== "string" ||
      claims.expiresAt <= nowSeconds ||
      claims.expiresAt > nowSeconds + 8 * 86_400
    ) {
      return null;
    }
    return claims as ReviewTokenClaims;
  } catch {
    return null;
  }
}
