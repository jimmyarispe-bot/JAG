import { describe, expect, it } from "vitest";

import {
  applicationFeeGate,
  canWaive,
  DEFAULT_APPLICATION_FEE_CENTS,
  type ApplicationFeeState,
} from "@/lib/admissions/fee/gate";

/**
 * The expensive mistake here is not a crash. It is a status this gate treats
 * as good enough, letting an application through unpaid — quietly, once, and
 * then for everybody.
 */

const fee = (over: Partial<ApplicationFeeState> = {}): ApplicationFeeState => ({
  status: over.status ?? "unpaid",
  amountCents: over.amountCents ?? DEFAULT_APPLICATION_FEE_CENTS,
});

describe("what gets through", () => {
  it("lets a paid application through", () => {
    expect(applicationFeeGate(fee({ status: "paid" }))).toEqual({ ok: true, because: "paid" });
  });

  it("lets a waived application through", () => {
    expect(applicationFeeGate(fee({ status: "waived" }))).toEqual({ ok: true, because: "waived" });
  });

  it("lets a campus that charges nothing through", () => {
    expect(applicationFeeGate({ status: "unpaid", amountCents: 0 })).toEqual({
      ok: true,
      because: "no_fee_charged",
    });
  });
});

describe("what does not", () => {
  it("stops an unpaid application and names the amount", () => {
    const out = applicationFeeGate(fee({ status: "unpaid" }));
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error("expected a refusal");
    expect(out.reason).toContain("$100.00");
    // A family who has just filled in a long form needs to know it is still there.
    expect(out.reason).toContain("Nothing you have entered is lost");
  });

  it("stops 'unknown', which is the whole reason that status exists", () => {
    // 291 gave every pre-September application 'unknown' rather than 'unpaid',
    // because those families may have paid through the old web forms and Square
    // has never been reconciled. Letting it pass would turn the one status that
    // admits ignorance into the one that waves everybody through.
    const out = applicationFeeGate(fee({ status: "unknown" }));
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error("expected a refusal");
    expect(out.reason).toContain("cannot confirm");
  });

  it("stops a status it has never heard of, rather than assuming it is fine", () => {
    for (const status of ["pending", "processing", "PAID", "", "complete"]) {
      const out = applicationFeeGate(fee({ status }));
      expect({ status, ok: out.ok }).toEqual({ status, ok: false });
    }
  });

  it("stops a negative fee, which is not a fee", () => {
    expect(applicationFeeGate({ status: "paid", amountCents: -100 }).ok).toBe(false);
  });

  it("does not let a zero-amount check be fooled by a negative one", () => {
    // `amountCents === 0` passes; `< 0` must not fall through to it.
    const out = applicationFeeGate({ status: "unpaid", amountCents: -1 });
    expect(out.ok).toBe(false);
  });
});

describe("the fee amount is per application, not global", () => {
  it("names whatever this application was actually charged", () => {
    const out = applicationFeeGate({ status: "unpaid", amountCents: 15_000 });
    if (out.ok) throw new Error("expected a refusal");
    expect(out.reason).toContain("$150.00");
    expect(out.reason).not.toContain("$100.00");
  });
});

describe("what may be waived", () => {
  it("allows waiving an unpaid fee", () => {
    expect(canWaive(fee({ status: "unpaid" })).ok).toBe(true);
  });

  it("allows waiving one whose payment was never confirmed", () => {
    expect(canWaive(fee({ status: "unknown" })).ok).toBe(true);
  });

  it("refuses to waive money already taken, because that is a refund", () => {
    const out = canWaive(fee({ status: "paid" }));
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error("expected a refusal");
    expect(out.reason).toContain("refund");
  });

  it("refuses to waive twice, so the first reason survives", () => {
    const out = canWaive(fee({ status: "waived" }));
    expect(out.ok).toBe(false);
    if (out.ok) throw new Error("expected a refusal");
    expect(out.reason).toContain("original reason stands");
  });

  it("refuses when there is no fee to waive", () => {
    expect(canWaive({ status: "unpaid", amountCents: 0 }).ok).toBe(false);
  });
});
