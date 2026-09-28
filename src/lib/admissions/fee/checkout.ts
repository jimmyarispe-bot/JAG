/**
 * Asking Square for the $100, and finding out whether it arrived.
 *
 * This is the half a family touches. The gate (gate.ts) has been refusing
 * submission since this morning; until this file existed there was no way to
 * satisfy it, which is a gate across a door with no handle.
 *
 * THE SHAPE OF IT, AND WHY.
 *
 *   create  - build a Square payment link against THIS CAMPUS'S location,
 *             carrying the application id as the order's reference, and store
 *             the order id we get back before the family goes anywhere.
 *   return  - the family comes back to a URL we chose. Ignore everything it
 *             says. Read the stored order id, ask Square what that order is,
 *             and decide from Square's answer alone.
 *
 * WHY THE ORDER ID IS STORED BEFORE THE FAMILY LEAVES. If it were only learned
 * on the way back, a parent who closed the tab after paying would have paid
 * with nothing on our side pointing at the payment. Stored first, the record
 * survives the family never returning - the fee can be confirmed later, by
 * them reloading or by staff.
 *
 * WHY STORING IT DOES NOT MARK ANYTHING PAID. `application_fee_reference` is
 * free text and 291's coherence constraint says nothing about it, so a
 * reference can sit on an `unpaid` row. Status moves to `paid` in exactly one
 * place: after orderConfirmsPayment returns true.
 *
 * THE SERVICE-ROLE CLIENT DOES THE WRITING, DELIBERATELY. A parent must never
 * be able to write their own fee status. Whether this parent may touch this
 * application at all is decided first, through the ordinary authenticated
 * client and the row-level policies; only then does the privileged client
 * record what Square said.
 */

import { createAuthClient } from "@/lib/supabase/server-auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { squareGet, squarePost } from "@/lib/connectors/square/client";
import {
  APPLICATION_FEE_CURRENCY,
  buildPaymentLinkRequest,
  readPaymentLinkResponse,
} from "@/lib/admissions/fee/payment-link";
import { orderConfirmsPayment, type SquareOrderLike } from "@/lib/admissions/fee/square-order-check";

export interface FeeContext {
  readonly applicationId: string;
  readonly status: string;
  readonly amountCents: number;
  readonly reference: string | null;
  readonly childName: string;
  readonly campusName: string;
  readonly squareLocationId: string | null;
  readonly guardianEmail: string | null;
}

type ContextRead =
  | { readonly ok: true; readonly fee: FeeContext }
  | { readonly ok: false; readonly reason: string };

/**
 * Everything the fee needs, read through the caller's own permissions.
 *
 * A refusal by row-level security arrives as an empty result rather than an
 * error - the house failure - so a missing row is reported as "we could not
 * read it", never treated as a $0 fee.
 */
export async function readFeeContext(applicationId: string): Promise<ContextRead> {
  const supabase = await createAuthClient();

  const { data, error } = await supabase
    .from("admissions_applications")
    .select(
      `id,
       application_fee_status,
       application_fee_cents,
       application_fee_reference,
       admissions_leads(first_name, last_name, preferred_name, guardian_email,
                        schools(name, square_location_id))`
    )
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: `We could not read this application just now: ${error.message}` };
  }
  if (!data) {
    return {
      ok: false,
      reason: "We could not find that application, or it is not one you can see.",
    };
  }

  const row = data as unknown as {
    application_fee_status?: unknown;
    application_fee_cents?: unknown;
    application_fee_reference?: unknown;
    admissions_leads?: {
      first_name?: unknown;
      last_name?: unknown;
      preferred_name?: unknown;
      guardian_email?: unknown;
      schools?: { name?: unknown; square_location_id?: unknown } | null;
    } | null;
  };

  const lead = row.admissions_leads ?? null;
  const school = lead?.schools ?? null;

  // Always the child's name, never a pronoun - it is printed on Square's page
  // and on the receipt the family keeps.
  const first = typeof lead?.first_name === "string" ? lead.first_name.trim() : "";
  const last = typeof lead?.last_name === "string" ? lead.last_name.trim() : "";
  const childName = [first, last].filter(Boolean).join(" ") || "this application";

  return {
    ok: true,
    fee: {
      applicationId,
      status: String(row.application_fee_status ?? ""),
      amountCents: Number(row.application_fee_cents ?? 0),
      reference:
        typeof row.application_fee_reference === "string" && row.application_fee_reference.trim()
          ? row.application_fee_reference.trim()
          : null,
      childName,
      campusName: typeof school?.name === "string" ? school.name : "this campus",
      squareLocationId:
        typeof school?.square_location_id === "string" && school.square_location_id.trim()
          ? school.square_location_id.trim()
          : null,
      guardianEmail:
        typeof lead?.guardian_email === "string" && lead.guardian_email.trim()
          ? lead.guardian_email.trim()
          : null,
    },
  };
}

export type CheckoutResult =
  | { readonly ok: true; readonly url: string }
  | { readonly ok: false; readonly reason: string };

/**
 * Create the payment page and hand back its address.
 *
 * Refuses rather than defaults, every time: no campus location, no payment; no
 * amount, no payment; already settled, nothing to pay.
 */
export async function createApplicationFeeCheckout(input: {
  readonly applicationId: string;
  readonly returnUrl: string;
}): Promise<CheckoutResult> {
  const context = await readFeeContext(input.applicationId);
  if (!context.ok) return { ok: false, reason: context.reason };
  const fee = context.fee;

  if (fee.status === "paid") {
    return { ok: false, reason: "This application fee is already paid." };
  }
  if (fee.status === "waived") {
    return { ok: false, reason: "This application fee has been waived, so there is nothing to pay." };
  }
  if (fee.amountCents === 0) {
    return { ok: false, reason: `${fee.campusName} charges no application fee.` };
  }
  if (!fee.squareLocationId) {
    return {
      ok: false,
      reason:
        `${fee.campusName} has no Square location recorded, so a payment for it cannot be ` +
        `taken here. Please contact the school office - this is ours to fix, not yours.`,
    };
  }

  const request = buildPaymentLinkRequest({
    applicationId: fee.applicationId,
    squareLocationId: fee.squareLocationId,
    amountCents: fee.amountCents,
    lineItemName: `Application fee — ${fee.childName} — ${fee.campusName}`,
    redirectUrl: input.returnUrl,
    buyerEmail: fee.guardianEmail,
  });
  if (!request.ok) return { ok: false, reason: request.reason };

  const response = await squarePost("/v2/online-checkout/payment-links", request.body);
  if (!response.ok) {
    return {
      ok: false,
      reason: `Square could not create a payment page just now. ${response.error}`,
    };
  }

  const link = readPaymentLinkResponse(response.data);
  if (!link.ok) return { ok: false, reason: link.reason };

  /**
   * Stored before the family is sent anywhere.
   *
   * If this write fails the link is thrown away rather than handed over. A
   * parent must not be sent to pay for an order we have no record of - they
   * would pay, and nothing on our side would ever find it.
   */
  const admin = createServiceRoleClient();
  const { error: writeError } = await admin
    .from("admissions_applications")
    // `as never`: migration 291 was hand-run, so these columns are not in the
    // generated database types until they are regenerated. The same cast is on
    // the waiver write in actions.ts, for the same reason.
    .update({ application_fee_reference: link.link.orderId } as never)
    .eq("id", fee.applicationId);

  if (writeError) {
    return {
      ok: false,
      reason:
        "We could not record this payment before starting it, so it has not been started. " +
        "Nothing has been charged. Please try again in a moment.",
    };
  }

  return { ok: true, url: link.link.url };
}

export type ConfirmResult =
  | { readonly ok: true; readonly already: boolean; readonly amountCents: number }
  | { readonly ok: false; readonly reason: string };

/**
 * Ask Square whether the fee was actually paid, and record it if so.
 *
 * NOTHING FROM THE RETURN TRIP IS READ. Not the query string, not a
 * transaction id in the URL, not the fact that the browser came back at all.
 * The only input is the order id this system stored when it created the link,
 * and the only evidence is what Square says about that order.
 */
export async function confirmApplicationFeePayment(
  applicationId: string
): Promise<ConfirmResult> {
  const context = await readFeeContext(applicationId);
  if (!context.ok) return { ok: false, reason: context.reason };
  const fee = context.fee;

  if (fee.status === "paid") {
    return { ok: true, already: true, amountCents: fee.amountCents };
  }
  if (fee.status === "waived") {
    return { ok: true, already: true, amountCents: 0 };
  }
  if (!fee.reference) {
    return {
      ok: false,
      reason: "No payment has been started for this application yet.",
    };
  }

  const read = await squareGet(`/v2/orders/${encodeURIComponent(fee.reference)}`);
  if (!read.ok) {
    return { ok: false, reason: `We could not reach Square to check that payment. ${read.error}` };
  }

  const order = (read.data as { order?: SquareOrderLike } | null)?.order ?? null;
  const verdict = orderConfirmsPayment(order, {
    referenceId: fee.applicationId,
    amountCents: fee.amountCents,
    currency: APPLICATION_FEE_CURRENCY,
  });

  if (!verdict.paid) return { ok: false, reason: verdict.reason };

  /**
   * 291's coherence constraint requires paid_at on a paid row and forbids the
   * waiver fields. Setting all four keeps the row legal whatever it held
   * before, and the database refuses the write if this is ever wrong.
   */
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("admissions_applications")
    .update({
      application_fee_status: "paid",
      application_fee_paid_at: new Date().toISOString(),
      application_fee_waived_by_user_id: null,
      application_fee_waiver_reason: null,
    } as never)
    .eq("id", applicationId);

  if (error) {
    return {
      ok: false,
      reason:
        "Square confirms the payment, but we could not record it here. Do not pay again - " +
        "please contact the school office and quote " + fee.reference + ".",
    };
  }

  return { ok: true, already: false, amountCents: verdict.amountCents };
}
