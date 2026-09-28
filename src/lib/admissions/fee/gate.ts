/**
 * No application is submitted until the $100 has been paid or waived.
 *
 * Jimmy, 28 September 2026: "need to make sure the $100 application fee is put
 * in at the end of the application and before it can be submitted."
 *
 * Migration 291 built the record on 6 September and said plainly what it did
 * not do: "It does not collect the fee. The four web forms still take the $100
 * through Square directly. Nothing writes to these columns yet." So the money
 * is collected outside the JAG, and nothing inside it has ever stopped an
 * application going through unpaid. This is the stop.
 *
 * WHY THE DECISION IS PURE. It reads two values and returns a sentence. Kept
 * out of the server action so it can be tested exhaustively, because the
 * expensive mistakes here are not crashes - they are a status this function
 * treats as good enough.
 *
 * 'unknown' DOES NOT PASS, and that is the whole reason it exists. 291 gave
 * every pre-September application that status rather than 'unpaid', because
 * those families may well have paid through the old web forms and nobody has
 * reconciled Square. It is an honest "we do not know". Letting it through the
 * gate would quietly convert the one status that admits ignorance into the one
 * that waves everybody past.
 *
 * AN UNRECOGNISED STATUS IS A REFUSAL. If a fifth value ever appears in that
 * column, this says no. A gate whose default is "allow" is a gate for as long
 * as nobody adds a row to an enum.
 */

/** $100, in the integer cents this codebase keeps money in. */
export const DEFAULT_APPLICATION_FEE_CENTS = 10_000;

export interface ApplicationFeeState {
  /** unknown | unpaid | paid | waived, per migration 291. */
  readonly status: string;
  /** What this application was charged. Zero means the campus charges nothing. */
  readonly amountCents: number;
}

export type FeeGateResult =
  | { readonly ok: true; readonly because: "paid" | "waived" | "no_fee_charged" }
  | { readonly ok: false; readonly reason: string };

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function applicationFeeGate(fee: ApplicationFeeState): FeeGateResult {
  // A campus that charges nothing has nothing to collect. Explicit zero, not
  // an absent value: 291 made the column NOT NULL with a default precisely so
  // "no fee" and "nobody set a fee" are different facts.
  if (fee.amountCents === 0) return { ok: true, because: "no_fee_charged" };

  if (fee.amountCents < 0) {
    return {
      ok: false,
      reason:
        "This application has a negative fee recorded, which is not a fee. " +
        "It has not been submitted. Please contact the school office.",
    };
  }

  switch (fee.status) {
    case "paid":
      return { ok: true, because: "paid" };

    case "waived":
      return { ok: true, because: "waived" };

    case "unpaid":
      return {
        ok: false,
        reason:
          `The ${usd(fee.amountCents)} application fee has not been paid yet, so this ` +
          `application has not been submitted. Nothing you have entered is lost.`,
      };

    case "unknown":
      return {
        ok: false,
        reason:
          `We cannot confirm whether the ${usd(fee.amountCents)} application fee was paid ` +
          `for this application, so it has not been submitted. This application predates ` +
          `fee tracking in the JAG. Please contact the school office and we will check.`,
      };

    default:
      return {
        ok: false,
        reason:
          `This application's fee is in a state the JAG does not recognise ` +
          `(${JSON.stringify(fee.status)}), so it has not been submitted. ` +
          `Please contact the school office.`,
      };
  }
}

/**
 * Whether a fee may still be waived.
 *
 * Waiving something already paid is not a kindness, it is a refund, and this
 * system has no refund path. Waiving twice is a second reason overwriting the
 * first, which destroys the record of why.
 */
export function canWaive(fee: ApplicationFeeState): FeeGateResult {
  if (fee.amountCents === 0) {
    return { ok: false, reason: "This campus charges no application fee, so there is nothing to waive." };
  }
  if (fee.status === "paid") {
    return {
      ok: false,
      reason:
        "This fee has already been paid. Waiving it would not return the money - " +
        "that is a refund, and refunds are not handled here.",
    };
  }
  if (fee.status === "waived") {
    return { ok: false, reason: "This fee is already waived. The original reason stands." };
  }
  if (fee.status !== "unpaid" && fee.status !== "unknown") {
    return { ok: false, reason: `Unrecognised fee status ${JSON.stringify(fee.status)}.` };
  }
  return { ok: true, because: "waived" };
}
