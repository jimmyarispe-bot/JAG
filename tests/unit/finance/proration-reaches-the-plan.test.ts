import { describe, expect, it } from "vitest";

import { buildPlan, standardSlots, type PlanLineInput } from "@/lib/finance/plan-builder";
import { prorationForStudent } from "@/lib/finance/school-year-months";

/**
 * THE TWO HALVES, JOINED.
 *
 * `school-year-months.ts` works out how many months a campus's year has.
 * `plan-builder.ts` prorates correctly over whatever month count it is handed.
 * Until 28 September 2026 nothing carried the first into the second: both
 * callers handed `buildPlan` the literal 12, and so a Virtual family was
 * billed eight twelfths of the year instead of eight tenths.
 *
 * These tests assert the joined result in dollars, because that is the figure
 * a parent reads. A test that only checked "monthsInYear was 10" would have
 * passed on the day the money was wrong.
 */

const FL_GA_YEAR = { startDate: "2026-06-01", endDate: "2027-05-31" }; // 12 months
const VIRTUAL_YEAR = { startDate: "2026-08-01", endDate: "2027-05-31" }; // 10 months

/** One annual line, priced to the year, so the arithmetic under test is the proration and nothing else. */
function annualLine(itemName: string, amount: number): PlanLineInput {
  return {
    itemCode: itemName.toLowerCase().replace(/\s+/g, "_"),
    itemName,
    amount,
    frequency: "annual",
    billedToFamily: true,
  };
}

/** What the plan editor now does: derive the pair, pass it only when it is not the full year. */
function planFor(
  year: { startDate: string; endDate: string },
  startDate: string,
  annualFee: number
) {
  const proration = prorationForStudent(year, startDate);
  return {
    proration,
    plan: buildPlan({
      lines: [annualLine("Tuition", annualFee)],
      proration: proration.isFullYear
        ? undefined
        : { monthsAttending: proration.monthsAttending, monthsInYear: proration.monthsInYear },
      instalments: standardSlots("2026-10-25"),
    }),
  };
}

describe("a late start at a ten-month campus", () => {
  it("bills The Academy Virtual eight tenths of $15,000, which is $12,000", () => {
    const { proration, plan } = planFor(VIRTUAL_YEAR, "2026-10-01", 15_000);

    expect(proration.monthsAttending).toBe(8);
    expect(proration.monthsInYear).toBe(10);
    expect(plan.annualTuition).toBe(15_000);
    expect(plan.proratedTuition).toBe(12_000);
    expect(plan.prorationLabel).toBe("8 of 10 months");
    expect(plan.remainingDue).toBe(12_000);
  });

  it("is $2,000 more than the twelve-month assumption it replaces", () => {
    const wrong = buildPlan({
      lines: [annualLine("Tuition", 15_000)],
      // What both callers used to pass: the right months attending over the
      // wrong months in the year.
      proration: { monthsAttending: 8, monthsInYear: 12 },
      instalments: standardSlots("2026-10-25"),
    });
    const right = planFor(VIRTUAL_YEAR, "2026-10-01", 15_000).plan;

    expect(wrong.proratedTuition).toBe(10_000);
    expect(right.proratedTuition).toBe(12_000);
    expect((right.proratedTuition ?? 0) - (wrong.proratedTuition ?? 0)).toBe(2_000);
  });

  it("counts a July start as the full ten months, not eleven", () => {
    const { proration, plan } = planFor(VIRTUAL_YEAR, "2026-07-15", 15_000);

    expect(proration.monthsAttending).toBe(10);
    expect(proration.isFullYear).toBe(true);
    // Not prorated at all, so proratedTuition stays null rather than repeating
    // the annual figure under a second name.
    expect(plan.proratedTuition).toBeNull();
    expect(plan.billingBasis).toBe(15_000);
  });
});

describe("a late start at a twelve-month campus", () => {
  it("bills The Academy GA eight twelfths of $19,950, which is $13,300", () => {
    const { proration, plan } = planFor(FL_GA_YEAR, "2026-10-01", 19_950);

    expect(proration.monthsAttending).toBe(8);
    expect(proration.monthsInYear).toBe(12);
    expect(plan.proratedTuition).toBe(13_300);
    expect(plan.prorationLabel).toBe("8 of 12 months");
  });

  it("does not prorate a family who starts the day the year opens", () => {
    const { proration, plan } = planFor(FL_GA_YEAR, "2026-06-01", 19_950);

    expect(proration.monthsAttending).toBe(12);
    expect(proration.isFullYear).toBe(true);
    expect(plan.proratedTuition).toBeNull();
    expect(plan.remainingDue).toBe(19_950);
  });
});

describe("the same start date at two campuses", () => {
  it("gives two different answers, which is the whole point", () => {
    const virtual = planFor(VIRTUAL_YEAR, "2026-11-01", 15_000).plan;
    const ga = planFor(FL_GA_YEAR, "2026-11-01", 15_000).plan;

    // Seven of ten against seven of twelve, on the same fee.
    expect(virtual.prorationLabel).toBe("7 of 10 months");
    expect(ga.prorationLabel).toBe("7 of 12 months");
    expect(virtual.proratedTuition).toBe(10_500);
    expect(ga.proratedTuition).toBe(8_750);
  });
});

describe("the schedule still adds up", () => {
  it("sums the instalments to exactly what is owed", () => {
    const { plan } = planFor(VIRTUAL_YEAR, "2026-10-01", 15_000);
    const summed = plan.instalments.reduce((total, i) => total + i.amount, 0);

    expect(summed).toBeCloseTo(plan.remainingDue, 2);
    expect(plan.instalmentTotal).toBeCloseTo(plan.remainingDue, 2);
  });

  it("raises no warnings on a clean prorated plan", () => {
    const { plan } = planFor(VIRTUAL_YEAR, "2026-10-01", 15_000);
    expect(plan.warnings).toEqual([]);
  });
});
