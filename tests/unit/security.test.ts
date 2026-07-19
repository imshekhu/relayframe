import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  enforceMutationSecurity,
  organizationFromRequest,
  requestContextFromRequest,
  readBoundedJson,
  resetSecurityRateLimitsForTests,
} from "@/lib/request-context";
import {
  SESSION_COOKIE,
  issueReviewToken,
  issueSessionToken,
  verifyReviewToken,
  verifySessionToken,
} from "@/security/session";

const previousSecret = process.env.SESSION_SECRET;

describe("security boundary", () => {
  beforeAll(() => {
    process.env.SESSION_SECRET =
      "unit-test-session-secret-with-at-least-32-characters";
  });

  beforeEach(() => {
    resetSecurityRateLimitsForTests();
  });

  afterAll(() => {
    if (previousSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = previousSecret;
  });

  function sessionToken(lifetime = 3600) {
    return issueSessionToken(
      {
        userId: "usr_security_test",
        organizationId: "org_security_test",
        role: "admin",
      },
      lifetime,
    );
  }

  it("signs, verifies, expires, and rejects tampered sessions", () => {
    const token = sessionToken();
    expect(verifySessionToken(token)?.organizationId).toBe("org_security_test");
    expect(verifySessionToken(`${token.slice(0, -2)}xx`)).toBeNull();

    const expired = sessionToken(1);
    expect(
      verifySessionToken(expired, Math.floor(Date.now() / 1000) + 2),
    ).toBeNull();
  });

  it("issues unguessable, scoped, expiring review capabilities", () => {
    const first = issueReviewToken("org_security_test", "prj_review");
    const second = issueReviewToken("org_security_test", "prj_review");
    expect(first).not.toBe(second);
    expect(verifyReviewToken(first)).toMatchObject({
      organizationId: "org_security_test",
      projectId: "prj_review",
    });
    expect(verifyReviewToken(`${first.slice(0, -2)}xx`)).toBeNull();
    expect(
      verifyReviewToken(first, Math.floor(Date.now() / 1_000) + 8 * 86_400),
    ).toBeNull();
  });

  it("derives tenancy from the signed session and ignores forged headers", () => {
    const request = new Request("https://relayframe.test/api/demo", {
      headers: {
        cookie: `${SESSION_COOKIE}=${sessionToken()}`,
        "x-relayframe-organization": "org_attacker",
      },
    });
    expect(organizationFromRequest(request)).toBe("org_security_test");
    expect(requestContextFromRequest(request, ["owner"])).toBeNull();
    expect(requestContextFromRequest(request, ["admin"])?.userId).toBe(
      "usr_security_test",
    );
  });

  it("rejects cross-site, oversized, unauthenticated, and excessive mutations", async () => {
    const cookie = `${SESSION_COOKIE}=${sessionToken()}`;
    const crossSite = enforceMutationSecurity(
      new Request("https://relayframe.test/api/projects", {
        method: "POST",
        headers: {
          cookie,
          origin: "https://attacker.test",
          "content-length": "10",
        },
      }),
      { scope: "security-test" },
    );
    expect(crossSite?.status).toBe(403);

    const oversized = enforceMutationSecurity(
      new Request("https://relayframe.test/api/projects", {
        method: "POST",
        headers: {
          cookie,
          origin: "https://relayframe.test",
          "content-length": "70000",
        },
      }),
      { scope: "security-test", maxBodyBytes: 1024 },
    );
    expect(oversized?.status).toBe(413);

    const unauthenticated = enforceMutationSecurity(
      new Request("https://relayframe.test/api/projects", {
        method: "POST",
        headers: {
          origin: "https://relayframe.test",
          "content-length": "10",
        },
      }),
      { scope: "security-test" },
    );
    expect(unauthenticated?.status).toBe(401);

    const allowedRequest = () =>
      new Request("https://relayframe.test/api/projects", {
        method: "POST",
        headers: {
          cookie,
          origin: "https://relayframe.test",
          "content-length": "10",
        },
      });
    expect(
      enforceMutationSecurity(allowedRequest(), {
        scope: "rate-test",
        limit: 2,
      }),
    ).toBeNull();
    expect(
      enforceMutationSecurity(allowedRequest(), {
        scope: "rate-test",
        limit: 2,
      }),
    ).toBeNull();
    const limited = enforceMutationSecurity(allowedRequest(), {
      scope: "rate-test",
      limit: 2,
    });
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("retry-after")).toBeTruthy();
  });

  it("bounds chunked JSON bodies even without Content-Length", async () => {
    const encoder = new TextEncoder();
    const request = new Request("https://relayframe.test/api/generations", {
      method: "POST",
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('{"prompt":"'));
          controller.enqueue(encoder.encode("x".repeat(2_000)));
          controller.enqueue(encoder.encode('"}'));
          controller.close();
        },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    await expect(readBoundedJson(request, 1_024)).rejects.toMatchObject({
      name: "RequestBodyError",
      status: 413,
    });
  });
});
