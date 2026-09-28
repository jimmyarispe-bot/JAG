import { describe, expect, it } from "vitest";

import {
  feeReturnPath,
  resolveFeeReturnOrigin,
} from "@/lib/admissions/fee/return-origin";
import {
  APPLICATION_FEE_CURRENCY,
  buildPaymentLinkRequest,
  readPaymentLinkResponse,
} from "@/lib/admissions/fee/payment-link";

const FALLBACK = "https://www.thejag.org";
const APPLICATION = "11111111-2222-3333-4444-555555555555";

function origin(over: Partial<Parameters<typeof resolveFeeReturnOrigin>[0]> = {}) {
  return resolveFeeReturnOrigin({
    requestHost: "theacademyway.thejag.org",
    requestProtocol: "https",
    organizationDomains: [],
    fallbackOrigin: FALLBACK,
    ...over,
  });
}

describe("where Square sends a family back to", () => {
  it("keeps the family on the platform host they arrived on", () => {
    expect(origin()).toBe("https://theacademyway.thejag.org");
  });

  it("accepts the platform apex", () => {
    expect(origin({ requestHost: "thejag.org" })).toBe("https://thejag.org");
  });

  it("accepts a custom domain that the organization actually maps", () => {
    expect(
      origin({
        requestHost: "apply.theacademyway.org",
        organizationDomains: ["apply.theacademyway.org"],
      })
    ).toBe("https://apply.theacademyway.org");
  });

  /**
   * The one that matters. A Host header is written by whoever made the
   * request; reflecting it into a URL a payment page will redirect a browser
   * to is the open-redirect. An unmapped host must not come back out.
   */
  it("refuses a host nobody has mapped, and falls back", () => {
    expect(origin({ requestHost: "evil.example.com" })).toBe(FALLBACK);
  });

  it("refuses a look-alike that merely ends with the platform name", () => {
    expect(origin({ requestHost: "thejag.org.evil.com" })).toBe(FALLBACK);
    expect(origin({ requestHost: "notthejag.org" })).toBe(FALLBACK);
  });

  it("refuses a mapped host arriving over plain http", () => {
    expect(
      origin({
        requestHost: "apply.theacademyway.org",
        requestProtocol: "http",
        organizationDomains: ["apply.theacademyway.org"],
      })
    ).toBe(FALLBACK);
  });

  it("falls back when there is no host at all", () => {
    expect(origin({ requestHost: null })).toBe(FALLBACK);
    expect(origin({ requestHost: "  " })).toBe(FALLBACK);
  });

  it("drops a port and lower-cases, so the comparison is against a hostname", () => {
    expect(origin({ requestHost: "TheAcademyWay.TheJag.ORG:443" })).toBe(
      "https://theacademyway.thejag.org"
    );
  });

  it("allows local development over http and nothing else", () => {
    expect(origin({ requestHost: "localhost:3000", requestProtocol: "http" })).toBe(
      "http://localhost:3000"
    );
  });

  it("never leaves a trailing slash on the fallback", () => {
    expect(origin({ requestHost: "evil.example.com", fallbackOrigin: "https://www.thejag.org/" })).toBe(
      "https://www.thejag.org"
    );
  });

  it("puts the application id in the return path", () => {
    expect(feeReturnPath(APPLICATION)).toBe(`/apply/portal/${APPLICATION}/fee/return`);
  });
});

function request(over: Partial<Parameters<typeof buildPaymentLinkRequest>[0]> = {}) {
  return buildPaymentLinkRequest({
    applicationId: APPLICATION,
    squareLocationId: "LTAVJXSWAWND1",
    amountCents: 10_000,
    lineItemName: "Application fee — Jayden Roy — The Academy GA",
    redirectUrl: `https://theacademyway.thejag.org${feeReturnPath(APPLICATION)}`,
    ...over,
  });
}

describe("the payment link we ask Square for", () => {
  it("carries the application id as the order reference", () => {
    const built = request();
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const order = built.body.order as { reference_id: string; location_id: string };
    expect(order.reference_id).toBe(APPLICATION);
  });

  /**
   * Migration 431: "A campus with no id here must REFUSE a payment rather than
   * fall back to another campus's location." There is no default to fall back
   * to, and this proves it.
   */
  it("refuses a campus with no Square location", () => {
    const built = request({ squareLocationId: "" });
    expect(built.ok).toBe(false);
    if (built.ok) return;
    expect(built.reason).toMatch(/another campus/i);
  });

  it("charges the campus's own location", () => {
    const built = request({ squareLocationId: "LXS2070R6BK2K" });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect((built.body.order as { location_id: string }).location_id).toBe("LXS2070R6BK2K");
  });

  it("asks in integer cents, in dollars", () => {
    const built = request();
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const item = (built.body.order as { line_items: { base_price_money: { amount: number; currency: string } }[] })
      .line_items[0];
    expect(item.base_price_money.amount).toBe(10_000);
    expect(item.base_price_money.currency).toBe(APPLICATION_FEE_CURRENCY);
  });

  it("refuses a zero, negative or fractional amount", () => {
    expect(request({ amountCents: 0 }).ok).toBe(false);
    expect(request({ amountCents: -100 }).ok).toBe(false);
    expect(request({ amountCents: 99.5 }).ok).toBe(false);
  });

  it("refuses a return address that is not a secure URL", () => {
    expect(request({ redirectUrl: "not-a-url" }).ok).toBe(false);
    expect(request({ redirectUrl: "http://evil.example.com/x" }).ok).toBe(false);
  });

  /**
   * A family who clicks Pay twice must meet the same payment page, not two
   * orders for one fee. The key is derived, so it is stable - and it changes
   * when the amount does, so a corrected fee gets its own link.
   */
  it("asks for the same link twice for the same fee, and a new one when the fee changes", () => {
    const a = request();
    const b = request();
    const c = request({ amountCents: 5_000 });
    expect(a.ok && b.ok && c.ok).toBe(true);
    if (!a.ok || !b.ok || !c.ok) return;
    expect(a.body.idempotency_key).toBe(b.body.idempotency_key);
    expect(a.body.idempotency_key).not.toBe(c.body.idempotency_key);
    expect(String(a.body.idempotency_key).length).toBeLessThanOrEqual(45);
  });

  it("sends the return address to Square, with tipping and shipping off", () => {
    const built = request();
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const options = built.body.checkout_options as {
      redirect_url: string;
      allow_tipping: boolean;
      ask_for_shipping_address: boolean;
    };
    expect(options.redirect_url).toContain("/fee/return");
    expect(options.allow_tipping).toBe(false);
    expect(options.ask_for_shipping_address).toBe(false);
  });

  it("omits the buyer email rather than sending an empty one", () => {
    const withNone = request({ buyerEmail: "   " });
    expect(withNone.ok).toBe(true);
    if (!withNone.ok) return;
    expect(withNone.body.pre_populated_data).toBeUndefined();

    const withOne = request({ buyerEmail: "parent@example.com" });
    expect(withOne.ok).toBe(true);
    if (!withOne.ok) return;
    expect(withOne.body.pre_populated_data).toEqual({ buyer_email: "parent@example.com" });
  });
});

describe("reading Square's answer", () => {
  it("takes the long url and the order id", () => {
    const read = readPaymentLinkResponse({
      payment_link: { url: "https://sq/short", long_url: "https://sq/long", order_id: "ORD1" },
    });
    expect(read).toEqual({ ok: true, link: { url: "https://sq/long", orderId: "ORD1" } });
  });

  it("falls back to url when there is no long_url", () => {
    const read = readPaymentLinkResponse({
      payment_link: { url: "https://sq/short", order_id: "ORD1" },
    });
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.link.url).toBe("https://sq/short");
  });

  /**
   * A link with no order id can be handed to a family and never verified -
   * they would pay and nothing here could ever confirm it. Refused.
   */
  it("refuses a link with no order id", () => {
    const read = readPaymentLinkResponse({ payment_link: { url: "https://sq/x" } });
    expect(read.ok).toBe(false);
    if (read.ok) return;
    expect(read.reason).toMatch(/never be confirmed/i);
  });

  it("refuses an empty, missing or wrong-shaped response", () => {
    expect(readPaymentLinkResponse(null).ok).toBe(false);
    expect(readPaymentLinkResponse({}).ok).toBe(false);
    expect(readPaymentLinkResponse({ payment_link: { order_id: "ORD1" } }).ok).toBe(false);
  });
});
