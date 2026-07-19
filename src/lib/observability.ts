import "server-only";

const sensitiveKeys = new Set([
  "prompt",
  "password",
  "token",
  "authorization",
  "cookie",
  "apiKey",
  "secret",
  "signedUrl",
]);

function sanitize(
  value: unknown,
  depth = 0,
): unknown {
  if (depth > 4) return "[MAX_DEPTH]";
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitiveKeys.has(key) ? "[REDACTED]" : sanitize(item, depth + 1),
      ]),
    );
  }
  if (typeof value === "string" && value.length > 500) {
    return `${value.slice(0, 500)}[TRUNCATED]`;
  }
  return value;
}

export function logDomainEvent(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown>,
) {
  const sanitized = sanitize(fields) as Record<string, unknown>;
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitized,
  });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.info(record);
}
