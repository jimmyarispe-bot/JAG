import { describe, expect, it } from "vitest";

import {
  orderConfirmsPayment,
  type ExpectedPayment,
  type SquareOrderLike,
} from "@/lib/admissions/fee/square-order-check";

/**
 * Every wrong answer in this file is money. The parent controls the return
 * trip from Square entirely - the URL, the query string, whether they come
 * back at all - so the only trustworthy input is what Square's own API says
 * when we ask it, and the only trustworthy check is this one.
 */

const EXPECTED: ExpectedPayment = {
  referenceId: "app-7f3a",
  amountCents: 10_000,
  currency: "USD",
};

const order = (over: Partial<SquareOrderLike> = {}): SquareOrderLike => ({
  id: "sq-order-1",
  state: "COMPLETED",
  reference_id: "app-7f3a",
  total_money: { amount: 10_000, currency: "USD" },
  ...over,
});

describe("a real payment", () => {
  it("is confirmed, with the order id to record", () => {
    expect(orderConfirmsPayment(order(), EXPECTED)).toEqual({
      paid: true,
      amountCents: 10_000,
      orderId: "sq-order-1",
    });
  });

  it("accepts an overpayment rather than arguing about it", () => {
    expect(
      orderConfirmsPayment(order({ total_money: { amount: 12_000, currency: "USD" } }), EXPECTED).paid
    ).toBe(true);
  });

  it("reads an amount Square sent as a string", () => {
    expect(
      orderConfirmsPayment(order({ total_money: { amount: "10000", currency: "USD" } }), EXPECTED).paid
    ).toBe(true);
  });
});

describe("the four ways to be wrong", () => {
  it("1. refuses an order that is not completed", () => {
    for (const state of ["OPEN", "CANCELED", "DRAFT", "", "completed "]) {
      expect({ state, paid: orderConfirmsPayment(order({ state }), EXPECTED).paid }).toEqual({
        state,
        paid: false,
      });
    }
  });

  it("1b. tells a family who just paid to wait rather than that it failed", () => {
    const out = orderConfirmsPayment(order({ state: "OPEN" }), EXPECTED);
    if (out.paid) throw new Error("expected a refusal");
    expect(out.reason).toContain("give it a moment");
  });

  it("2. refuses a payment made against a different application", () => {
    // One $100 must not satisfy two applications.
    const out = orderConfirmsPayment(order({ reference_id: "app-other" }), EXPECTED);
    if (out.paid) throw new Error("expected a refusal");
    expect(out.reason).toContain("different application");
  });

  it("2b. refuses an order carrying no reference at all", () => {
    expect(orderConfirmsPayment(order({ reference_id: undefined }), EXPECTED).paid).toBe(false);
  });

  it("3. refuses an underpayment instead of part-crediting it", () => {
    const out = orderConfirmsPayment(order({ total_money: { amount: 100, currency: "USD" } }), EXPECTED);
    if (out.paid) throw new Error("expected a refusal");
    expect(out.reason).toContain("part payment");
  });

  it("4. refuses another currency", () => {
    const out = orderConfirmsPayment(order({ total_money: { amount: 10_000, currency: "CAD" } }), EXPECTED);
    if (out.paid) throw new Error("expected a refusal");
    expect(out.reason).toContain("CAD");
  });
});

describe("malformed or absent", () => {
  it("refuses nothing at all", () => {
    expect(orderConfirmsPayment(null, EXPECTED).paid).toBe(false);
    expect(orderConfirmsPayment(undefined, EXPECTED).paid).toBe(false);
  });

  it("refuses an order with no id, which could not be recorded anyway", () => {
    expect(orderConfirmsPayment(order({ id: undefined }), EXPECTED).paid).toBe(false);
  });

  it("refuses an amount that is not a number", () => {
    for (const amount of [undefined, null, "many", "10.00", {}]) {
      expect(
        orderConfirmsPayment(order({ total_money: { amount, currency: "USD" } }), EXPECTED).paid
      ).toBe(false);
    }
  });

  it("refuses a completed order that still owes money", () => {
    // Square can complete an order against a partial tender. The state alone
    // is not the answer.
    const out = orderConfirmsPayment(order({ net_amount_due_money: { amount: 5_000 } }), EXPECTED);
    if (out.paid) throw new Error("expected a refusal");
    expect(out.reason).toContain("outstanding");
  });

  it("is untroubled by an order that owes nothing", () => {
    expect(orderConfirmsPayment(order({ net_amount_due_money: { amount: 0 } }), EXPECTED).paid).toBe(
      true
    );
  });
});
