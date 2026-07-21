/** Billing module test path — delegates to finance-platform suite coverage. */
import { describe, expect, it } from "vitest";
import { ACTIVITY_EVENT_CATALOG } from "@/lib/platform/activity/catalog";
import { periodAmountFromAnnual } from "@/lib/finance-platform/tuition";

describe("billing platform smoke", () => {
  it("exposes payment.received for release gate", () => {
    expect(ACTIVITY_EVENT_CATALOG["payment.received"]).toBeTruthy();
  });

  it("computes monthly tuition period", () => {
    expect(periodAmountFromAnnual(24000, "monthly")).toBe(2000);
  });
});
