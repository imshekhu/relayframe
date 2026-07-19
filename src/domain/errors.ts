export type ApplicationErrorCode =
  | "NOT_FOUND"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "IDEMPOTENCY_CONFLICT"
  | "INSUFFICIENT_CREDITS"
  | "BUDGET_EXCEEDED"
  | "INVALID_STATE"
  | "RATE_LIMITED"
  | "PROVIDER_FAILED"
  | "INTERNAL_ERROR";

export class ApplicationError extends Error {
  constructor(
    readonly code: ApplicationErrorCode,
    message: string,
    readonly status: number,
    readonly retryable = false,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

export function normalizeApplicationError(error: unknown) {
  if (error instanceof ApplicationError) return error;
  if (error instanceof Error) {
    const mappings: Array<
      [RegExp, ApplicationErrorCode, number, boolean]
    > = [
      [/not found/i, "NOT_FOUND", 404, false],
      [/insufficient credits/i, "INSUFFICIENT_CREDITS", 402, false],
      [/credit ceiling/i, "BUDGET_EXCEEDED", 409, false],
      [/idempotency key/i, "IDEMPOTENCY_CONFLICT", 409, false],
      [/safety policy/i, "FORBIDDEN", 403, false],
      [/provider/i, "PROVIDER_FAILED", 502, true],
    ];
    for (const [pattern, code, status, retryable] of mappings) {
      if (pattern.test(error.message)) {
        return new ApplicationError(
          code,
          error.message,
          status,
          retryable,
        );
      }
    }
  }
  return new ApplicationError(
    "INTERNAL_ERROR",
    "An internal error occurred",
    500,
    true,
  );
}
