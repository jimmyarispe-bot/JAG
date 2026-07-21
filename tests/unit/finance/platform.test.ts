/** Finance module test path — RC7 calculations. */
import { describe, expect, it } from "vitest";
import { bucketForDays, accumulateAging, emptyAging } from "@/lib/finance-platform/aging";
import { resolveStackedDiscounts } from "@/lib/finance-platform/discounts";

describe("finance calculations", () => {
  it("ages balances into executive buckets", () => {
    expect(bucketForDays(120)).toBe("days_120_plus");
    const aging = accumulateAging(emptyAging(), 250, 85);
    expect(aging.days90).toBe(250);
  });

  it("stacks discounts with priority stop", () => {
    const result = resolveStackedDiscounts(
      [
        {
          id: "a",
          amount: 100,
          amountType: "flat",
          stackingPriority: 1,
          allowsStacking: false,
        },
        {
          id: "b",
          amount: 50,
          amountType: "flat",
          stackingPriority: 2,
          allowsStacking: true,
        },
      ],
      500
    );
    expect(result.totalDiscount).toBe(100);
    expect(result.applied).toHaveLength(1);
  });
});
