import { describe, expect, it } from "vitest";
import {
  calculateCreditBalance,
  calculateReservedCredits,
  quoteGeneration,
} from "@/domain/ledger";
import type { LedgerEntry } from "@/domain/types";

const base = {
  organizationId: "org_test",
  createdAt: new Date(0).toISOString(),
};

describe("credit ledger", () => {
  it("reconstructs reservation and settlement without double charging", () => {
    const entries: LedgerEntry[] = [
      {
        ...base,
        id: "1",
        type: "grant",
        amount: 100,
        idempotencyKey: "grant",
      },
      {
        ...base,
        id: "2",
        generationId: "gen_1",
        type: "reservation",
        amount: 30,
        idempotencyKey: "reserve",
      },
    ];
    expect(calculateCreditBalance(entries)).toBe(70);
    expect(calculateReservedCredits(entries)).toBe(30);

    entries.push(
      {
        ...base,
        id: "3",
        generationId: "gen_1",
        type: "release",
        amount: 30,
        idempotencyKey: "release",
      },
      {
        ...base,
        id: "4",
        generationId: "gen_1",
        type: "consumption",
        amount: 24,
        idempotencyKey: "consume",
      },
    );
    expect(calculateCreditBalance(entries)).toBe(76);
    expect(calculateReservedCredits(entries)).toBe(0);
  });

  it("quotes video above equivalent image work", () => {
    expect(quoteGeneration(5, 3, 2, "text_to_video")).toBeGreaterThan(
      quoteGeneration(5, 3, 2, "text_to_image"),
    );
  });
});
