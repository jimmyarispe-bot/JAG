/**
 * Deciding whether Square actually took the money.
 *
 * THIS IS THE FUNCTION THAT MUST NOT BE WRONG.
 *
 * A parent is redirected to Square, pays, and comes back to a URL we chose.
 * Everything about that return trip is under their control: the path, the
 * query string, the timing, whether they came back at all. The only thing that
 * is not is what Square's own API says when we ask it. So the question is
 * never "did the browser tell us it paid" - it is "does the order Square
 * reports match the one we asked for, in the state and the amount we asked
 * for".
 *
 * Pure, and separated from the fetch, because every wrong answer here is money.
 * Four ways to be wrong, all of them tested:
 *
 *   1. Accept an order that is not COMPLETED           - paid nothing
 *   2. Accept an order for the wrong application       - one payment, two
 *                                                        applications through
 *   3. Accept an order for less than the fee           - paid $1, owed $100
 *   4. Accept an order in another currency             - paid 100 of something
 *
 * Under-payment is refused rather than part-credited. This system has no
 * concept of a partly paid application fee, and inventing one inside a
 * verification function is how it would acquire one by accident.
 */

export interface ExpectedPayment {
  /** Our own id for this payment. Square echoes it back as reference_id. */
  readonly referenceId: string;
  readonly amountCents: number;
  readonly currency: string;
}

export type OrderCheck =
  | { readonly paid: true; readonly amountCents: number; readonly orderId: string }
  | { readonly paid: false; readonly reason: string };

/** Square's order shape, narrowed to what this decision needs. */
export interface SquareOrderLike {
  readonly id?: unknown;
  readonly state?: unknown;
  readonly reference_id?: unknown;
  readonly total_money?: { readonly amount?: unknown; readonly currency?: unknown } | null;
  readonly net_amount_due_money?: { readonly amount?: unknown } | null;
}

function asInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  // Square returns amounts as JSON numbers, but a bigint-safe client may hand
  // them over as strings. A string that is not a number is not a zero.
  if (typeof v === "string" && /^-?\d+$/.test(v.trim())) return Number(v.trim());
  return null;
}

function asText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function orderConfirmsPayment(
  order: SquareOrderLike | null | undefined,
  expected: ExpectedPayment
): OrderCheck {
  if (!order) {
    return { paid: false, reason: "Square returned no order for that payment." };
  }

  const orderId = asText(order.id);
  if (!orderId) {
    return { paid: false, reason: "Square returned an order with no id, which cannot be recorded." };
  }

  // The reference is ours. If it does not match, this is somebody else's
  // payment - or the same family's payment for a different application - and
  // crediting it here would let one $100 satisfy two applications.
  const reference = asText(order.reference_id);
  if (reference !== expected.referenceId) {
    return {
      paid: false,
      reason:
        `That payment belongs to a different application ` +
        `(expected ${expected.referenceId}, Square says ${reference || "nothing"}).`,
    };
  }

  const state = asText(order.state).toUpperCase();
  if (state !== "COMPLETED") {
    return {
      paid: false,
      reason:
        state === "OPEN"
          ? "Square has not completed that payment yet. If you have just paid, give it a moment and refresh."
          : `Square reports that order as ${state || "in no state at all"}, not completed.`,
    };
  }

  const currency = asText(order.total_money?.currency).toUpperCase();
  if (currency !== expected.currency.toUpperCase()) {
    return {
      paid: false,
      reason: `That payment is in ${currency || "an unstated currency"}, not ${expected.currency}.`,
    };
  }

  const total = asInt(order.total_money?.amount);
  if (total === null) {
    return { paid: false, reason: "Square did not report an amount for that order." };
  }
  if (total < expected.amountCents) {
    return {
      paid: false,
      reason:
        `That payment is for ${(total / 100).toFixed(2)} and the fee is ` +
        `${(expected.amountCents / 100).toFixed(2)}. A part payment does not complete an application.`,
    };
  }

  // A completed order that still owes money is not paid, whatever its state
  // says. Square can complete an order against a partial tender.
  const due = asInt(order.net_amount_due_money?.amount);
  if (due !== null && due > 0) {
    return {
      paid: false,
      reason: `Square still shows ${(due / 100).toFixed(2)} outstanding on that order.`,
    };
  }

  return { paid: true, amountCents: total, orderId };
}
