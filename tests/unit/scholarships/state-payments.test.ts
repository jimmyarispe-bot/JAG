import { describe, expect, it } from "vitest";

import { statePaymentSchedule } from "@/lib/scholarships/state-payments";

const base = { programName: "GA Special Needs Scholarship", awardYear: "2026-2027", paymentSchedule: "quarterly" };

describe("state payment schedule", () => {
  it("GSNS at 75% is the last three quarters, split evenly", () => {
    const s = statePaymentSchedule({ ...base, programCode: "ga_esa", awardedAmount: 8744.25, awardPercent: 75 });
    expect(s.map((p) => [p.dueDate, p.amount])).toEqual([
      ["2026-12-15", 2914.75],
      ["2027-02-15", 2914.75],
      ["2027-05-15", 2914.75],
    ]);
    expect(s.every((p) => !p.estimated)).toBe(true);
  });

  it("the last payment carries the odd cent", () => {
    const s = statePaymentSchedule({ ...base, programCode: "ga_esa", awardedAmount: 100, awardPercent: 75 });
    expect(s.map((p) => p.amount)).toEqual([33.33, 33.33, 33.34]);
  });

  it("another quarterly program: four payments, dates estimated", () => {
    const s = statePaymentSchedule({ ...base, programCode: "fl_step_up", programName: "Step Up", awardedAmount: 8000, awardPercent: null });
    expect(s).toHaveLength(4);
    expect(s.every((p) => p.estimated)).toBe(true);
  });

  it("annual: one payment", () => {
    const s = statePaymentSchedule({ ...base, programCode: "ga_goal", paymentSchedule: "annual", awardedAmount: 5000, awardPercent: null });
    expect(s).toHaveLength(1);
    expect(s[0].amount).toBe(5000);
  });
});
