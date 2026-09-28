/**
 * The request that asks Square for a payment page, and the reading of what
 * comes back.
 *
 * Pure and separate from the fetch, for the same reason square-order-check.ts
 * is: the two things that must not be wrong here are the reference that ties
 * the payment to this application, and the location that decides whose ledger
 * the money lands in. Both are decided in this file and can be asserted
 * without a network.
 *
 * THE REFERENCE IS THE APPLICATION ID, AND THAT IS LOAD-BEARING.
 * `orderConfirmsPayment` refuses any order whose `reference_id` is not the one
 * it expects. That is what stops one $100 satisfying two applications. It only
 * works if the link is created with the reference set - which is why this uses
 * the `order` form of the Payment Links API and not `quick_pay`, which has
 * nowhere to put one.
 *
 * THE LOCATION IS THE CAMPUS'S OWN. Migration 431 put a Square location on
 * each school and said why: "A campus with no id here must REFUSE a payment
 * rather than fall back to another campus's location - a fallback would move
 * real money into the wrong book, silently, which is the worst failure
 * available in this whole chain." There is no default here for that reason.
 *
 * THE IDEMPOTENCY KEY IS DERIVED, NOT RANDOM. A family who clicks Pay twice
 * should meet the same payment page, not two orders for the same fee. The key
 * is a hash of the application, the amount and the location, so the same fee
 * at the same campus always asks for the same link, and changing the amount
 * asks for a new one.
 */

import { createHash } from "node:crypto";

/** Every campus in this network banks in US dollars. Asserted on the way back. */
export const APPLICATION_FEE_CURRENCY = "USD";

export interface PaymentLinkRequestInput {
  readonly applicationId: string;
  readonly squareLocationId: string;
  readonly amountCents: number;
  /** Shown on Square's page. The child's name, never a pronoun. */
  readonly lineItemName: string;
  /** Absolute, built by resolveFeeReturnOrigin + feeReturnPath. */
  readonly redirectUrl: string;
  /** Pre-fills the receipt field. Optional - a missing email is not a blocker. */
  readonly buyerEmail?: string | null;
}

export type PaymentLinkRequest =
  | { readonly ok: true; readonly body: Record<string, unknown> }
  | { readonly ok: false; readonly reason: string };

export function buildPaymentLinkRequest(input: PaymentLinkRequestInput): PaymentLinkRequest {
  if (!input.applicationId.trim()) {
    return { ok: false, reason: "No application was named, so no payment can be created." };
  }
  if (!input.squareLocationId.trim()) {
    return {
      ok: false,
      reason:
        "This campus has no Square location recorded, so a payment for it cannot be taken. " +
        "Taking it anywhere else would put the money in another campus's books.",
    };
  }
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    return {
      ok: false,
      reason: `A payment cannot be created for ${input.amountCents} cents.`,
    };
  }
  let redirect: URL;
  try {
    redirect = new URL(input.redirectUrl);
  } catch {
    return { ok: false, reason: "The return address for this payment is not a valid URL." };
  }
  if (redirect.protocol !== "https:" && redirect.hostname !== "localhost") {
    return { ok: false, reason: "The return address for this payment is not secure." };
  }

  const idempotencyKey = createHash("sha256")
    .update(
      [
        "application-fee-v1",
        input.applicationId,
        input.squareLocationId,
        String(input.amountCents),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 44); // Square caps the key at 45 characters.

  const body: Record<string, unknown> = {
    idempotency_key: idempotencyKey,
    order: {
      location_id: input.squareLocationId,
      // Read back by orderConfirmsPayment. Square caps reference_id at 40
      // characters; an application id is a 36-character UUID.
      reference_id: input.applicationId,
      line_items: [
        {
          name: input.lineItemName.slice(0, 500),
          quantity: "1",
          base_price_money: {
            amount: input.amountCents,
            currency: APPLICATION_FEE_CURRENCY,
          },
        },
      ],
    },
    checkout_options: {
      redirect_url: input.redirectUrl,
      ask_for_shipping_address: false,
      allow_tipping: false,
    },
  };

  const email = input.buyerEmail?.trim();
  if (email) {
    (body as { pre_populated_data?: unknown }).pre_populated_data = { buyer_email: email };
  }

  return { ok: true, body };
}

export interface PaymentLinkCreated {
  readonly url: string;
  readonly orderId: string;
}

export type PaymentLinkRead =
  | { readonly ok: true; readonly link: PaymentLinkCreated }
  | { readonly ok: false; readonly reason: string };

/**
 * Read Square's answer.
 *
 * BOTH FIELDS ARE REQUIRED. The url is what the family clicks; the order id is
 * the only way we will ever find this payment again, because the return trip
 * is not trusted. A response with a url and no order id is a link we can hand
 * out and never verify, so it is refused rather than used.
 */
export function readPaymentLinkResponse(data: unknown): PaymentLinkRead {
  const link = (data as { payment_link?: Record<string, unknown> } | null)?.payment_link;
  if (!link || typeof link !== "object") {
    return { ok: false, reason: "Square did not return a payment link." };
  }

  const url = typeof link.long_url === "string" && link.long_url
    ? link.long_url
    : typeof link.url === "string"
      ? link.url
      : "";
  const orderId = typeof link.order_id === "string" ? link.order_id : "";

  if (!url) return { ok: false, reason: "Square returned a payment link with no address." };
  if (!orderId) {
    return {
      ok: false,
      reason:
        "Square returned a payment link with no order id. Without one the payment could " +
        "never be confirmed, so it has not been used.",
    };
  }

  return { ok: true, link: { url, orderId } };
}
