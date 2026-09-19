import { describe, expect, it } from "vitest";
import {
  grossForWork,
  totalsByPerson,
  workRateOn,
  type WorkPayRow,
  type WorkRate,
} from "@/lib/finance/work-pay";

/**
 * PAY FOR WORK THAT IS NOT A CLASS.
 *
 * Jimmy, 19 September 2026: "if katie vetere does admin work it is at $25 per
 * hour". Katie also teaches, so the danger this file guards against is a rate
 * meant for one person leaking onto everybody, or a network rate quietly
 * overwriting what one person was promised.
 */

const rate = (over: Partial<WorkRate> = {}): WorkRate => ({
  code: "admin_hourly",
  label: "Administrative work",
  unit: "hour",
  amount: 25,
  employeeId: null,
  cadenceNote: null,
  effectiveFrom: "2026-09-01",
  ...over,
});

const KATIE = "katie-employee-id";
const SOMEBODY_ELSE = "other-employee-id";

describe("grossForWork", () => {
  it("pays hours at the hourly rate", () => {
    expect(grossForWork(rate({ amount: 25 }), 3)).toBe(75);
  });

  it("keeps part hours to the cent", () => {
    // 2.5 x 25 in floating point is 62.500000000000004 if it is not rounded.
    expect(grossForWork(rate({ amount: 25 }), 2.5)).toBe(62.5);
  });

  it("pays an occurrence once, however long it ran", () => {
    const staffMeeting = rate({ code: "staff_meeting", unit: "occurrence", amount: 15 });
    expect(grossForWork(staffMeeting, 1)).toBe(15);
  });

  it("multiplies a per-student rate by the head count", () => {
    const greatness = rate({ code: "greatness_report", unit: "student", amount: 5 });
    expect(grossForWork(greatness, 6)).toBe(30);
  });

  it("does NOT apply the class volume discount", () => {
    /* A class pays 20.00 for the first child and 5.00 for each after. Nothing on
       the non-class lines of the sheet works that way: six conferences at 15.00
       is 90.00, not 15.00 + 5 x 5.00. */
    const conference = rate({ code: "parent_conference", unit: "student", amount: 15 });
    expect(grossForWork(conference, 6)).toBe(90);
  });

  it("pays nothing for a claim of nothing", () => {
    expect(grossForWork(rate(), 0)).toBe(0);
  });
});

describe("workRateOn", () => {
  it("finds a network rate for anybody", () => {
    const rates = [rate({ code: "staff_meeting", unit: "occurrence", amount: 15 })];
    const found = workRateOn(rates, "staff_meeting", SOMEBODY_ELSE, "2026-10-14");
    expect(found?.amount).toBe(15);
  });

  it("gives a person-specific rate only to that person", () => {
    const rates = [rate({ employeeId: KATIE, amount: 25 })];

    expect(workRateOn(rates, "admin_hourly", KATIE, "2026-10-14")?.amount).toBe(25);
    expect(workRateOn(rates, "admin_hourly", SOMEBODY_ELSE, "2026-10-14")).toBeNull();
  });

  it("lets a person's own rate beat a network rate for the same code", () => {
    /* If an 'admin_hourly' network rate is ever added at 18.00, Katie must still
       be paid the 25.00 she was promised. */
    const rates = [
      rate({ employeeId: null, amount: 18 }),
      rate({ employeeId: KATIE, amount: 25 }),
    ];

    expect(workRateOn(rates, "admin_hourly", KATIE, "2026-10-14")?.amount).toBe(25);
    expect(workRateOn(rates, "admin_hourly", SOMEBODY_ELSE, "2026-10-14")?.amount).toBe(18);
  });

  it("prices a day at the rate in force on that day, not the newest one", () => {
    const rates = [
      rate({ employeeId: KATIE, amount: 25, effectiveFrom: "2026-09-01" }),
      rate({ employeeId: KATIE, amount: 30, effectiveFrom: "2026-11-01" }),
    ];

    // September recalculated in December still returns September's rate.
    expect(workRateOn(rates, "admin_hourly", KATIE, "2026-09-20")?.amount).toBe(25);
    expect(workRateOn(rates, "admin_hourly", KATIE, "2026-11-05")?.amount).toBe(30);
  });

  it("returns null before a rate starts, rather than the next one along", () => {
    const rates = [rate({ employeeId: KATIE, effectiveFrom: "2026-09-01" })];
    expect(workRateOn(rates, "admin_hourly", KATIE, "2026-08-28")).toBeNull();
  });

  it("does not answer for a different kind of work", () => {
    const rates = [rate({ code: "staff_meeting", unit: "occurrence", amount: 15 })];
    expect(workRateOn(rates, "math_assessment", KATIE, "2026-10-14")).toBeNull();
  });
});

describe("totalsByPerson", () => {
  const row = (over: Partial<WorkPayRow>): WorkPayRow => ({
    claimId: "claim",
    employeeId: KATIE,
    personName: "Katie Vetere",
    schoolId: "school",
    workCode: "admin_hourly",
    workLabel: "Administrative work",
    workDate: "2026-10-14",
    unit: "hour",
    quantity: 1,
    amount: 25,
    cadenceNote: null,
    notes: null,
    gross: 25,
    ...over,
  });

  it("adds a person's claims across kinds of work", () => {
    const totals = totalsByPerson([
      row({ claimId: "a", quantity: 3, gross: 75 }),
      row({ claimId: "b", workCode: "staff_meeting", unit: "occurrence", amount: 15, gross: 15 }),
    ]);

    expect(totals).toHaveLength(1);
    expect(totals[0].personName).toBe("Katie Vetere");
    expect(totals[0].items).toBe(2);
    expect(totals[0].gross).toBe(90);
  });

  it("keeps people apart", () => {
    const totals = totalsByPerson([
      row({ claimId: "a", gross: 75 }),
      row({ claimId: "b", employeeId: SOMEBODY_ELSE, personName: "Craig Mann", gross: 15 }),
    ]);

    expect(totals.map((t) => t.personName)).toEqual(["Craig Mann", "Katie Vetere"]);
  });
});
