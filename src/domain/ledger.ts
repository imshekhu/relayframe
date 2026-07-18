import type { Generation, LedgerEntry } from "./types";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Insufficient available credits");
    this.name = "InsufficientCreditsError";
  }
}

export function calculateCreditBalance(entries: LedgerEntry[]) {
  return entries.reduce((balance, entry) => {
    switch (entry.type) {
      case "grant":
      case "purchase":
      case "release":
      case "refund":
        return balance + entry.amount;
      case "reservation":
      case "consumption":
        return balance - entry.amount;
    }
  }, 0);
}

export function calculateReservedCredits(entries: LedgerEntry[]) {
  const reservations = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.generationId) continue;
    if (entry.type === "reservation") {
      reservations.set(
        entry.generationId,
        (reservations.get(entry.generationId) ?? 0) + entry.amount,
      );
    }
    if (["release", "consumption", "refund"].includes(entry.type)) {
      reservations.set(
        entry.generationId,
        Math.max(
          0,
          (reservations.get(entry.generationId) ?? 0) - entry.amount,
        ),
      );
    }
  }
  return [...reservations.values()].reduce((sum, amount) => sum + amount, 0);
}

export function quoteGeneration(
  baseCredits: number,
  creditPerOutput: number,
  outputCount: number,
  operation: Generation["operation"],
) {
  const operationMultiplier = operation.includes("video") ? 2.4 : 1;
  return Math.ceil(
    (baseCredits + creditPerOutput * outputCount) * operationMultiplier,
  );
}

export function reservationIdempotencyKey(generationId: string) {
  return `generation:${generationId}:reserve:v1`;
}

export function consumptionIdempotencyKey(generationId: string) {
  return `generation:${generationId}:consume:v1`;
}

export function releaseIdempotencyKey(generationId: string) {
  return `generation:${generationId}:release:v1`;
}
