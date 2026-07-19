import "server-only";

import { z } from "zod";
import { isDemoMode } from "./session";

const productionEnvironmentSchema = z.object({
  SESSION_SECRET: z.string().min(32),
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgres")),
  REDIS_URL: z.string().url().refine((value) => value.startsWith("redis")),
  NEXT_PUBLIC_APP_URL: z.string().url().refine((value) => value.startsWith("https://")),
});

export function securityReadiness() {
  if (isDemoMode()) {
    return {
      ready: true,
      mode: "demo" as const,
      missing: [] as string[],
    };
  }
  const parsed = productionEnvironmentSchema.safeParse(process.env);
  if (parsed.success) {
    return {
      ready: true,
      mode: "production" as const,
      missing: [] as string[],
    };
  }
  return {
    ready: false,
    mode: "production" as const,
    missing: parsed.error.issues.map((issue) => String(issue.path[0])),
  };
}

export function assertSecureProductionConfiguration() {
  const readiness = securityReadiness();
  if (!readiness.ready) {
    throw new Error(
      `Secure production configuration incomplete: ${readiness.missing.join(", ")}`,
    );
  }
}
