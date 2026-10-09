import { describe, expect, it } from "vitest";

import {
  CRAIG_MANN_IVY_ASH_TUTORING,
  KATIE_VETERE_ADMIN,
  classPay,
  extraPay,
  hourlyPay,
  weekTotals,
} from "@/lib/finance/teacher-pay/rates";

describe("what one class earns", () => {
  it("pays $20 for one student in an ordinary class", () => {
    const p = classPay({ scheduledStudents: 1, structuredLiteracy: false });
    expect(p.ok && p.cents).toBe(2_000);
  });

  it("pays $20 plus $5 a head after the first", () => {
    expect((classPay({ scheduledStudents: 4, structuredLiteracy: false }) as { cents: number }).cents)
      .toBe(3_500);
    expect((classPay({ scheduledStudents: 6, structuredLiteracy: false }) as { cents: number }).cents)
      .toBe(4_500);
  });

  it("pays $35 for the first student in Structured Literacy", () => {
    expect((classPay({ scheduledStudents: 1, structuredLiteracy: true }) as { cents: number }).cents)
      .toBe(3_500);
    expect((classPay({ scheduledStudents: 4, structuredLiteracy: true }) as { cents: number }).cents)
      .toBe(5_000);
  });

  /**
   * Jimmy, 29 September: pay counts students SCHEDULED. A child who stays home
   * does not reduce what the teacher earns. This is the decision every figure
   * in the system turns on, so it is asserted directly rather than implied.
   */
  it("does not know or care how many were absent", () => {
    const six = classPay({ scheduledStudents: 6, structuredLiteracy: false });
    expect(six.ok && six.cents).toBe(4_500);
  });

  it("pays nothing for a class nobody was scheduled for", () => {
    const p = classPay({ scheduledStudents: 0, structuredLiteracy: false });
    expect(p.ok && p.cents).toBe(0);
    const sl = classPay({ scheduledStudents: 0, structuredLiteracy: true });
    expect(sl.ok && sl.cents).toBe(0);
  });

  it("refuses a roster that is not a whole, non-negative count", () => {
    expect(classPay({ scheduledStudents: -1, structuredLiteracy: false }).ok).toBe(false);
    expect(classPay({ scheduledStudents: 2.5, structuredLiteracy: false }).ok).toBe(false);
    expect(classPay({ scheduledStudents: NaN, structuredLiteracy: false }).ok).toBe(false);
  });
});

describe("the extras", () => {
  it("pays $5 a GREATNESS Report, but never in December or May", () => {
    expect((extraPay({ kind: "greatness_report", quantity: 7, month: 9 }) as { cents: number }).cents)
      .toBe(3_500);
    expect(extraPay({ kind: "greatness_report", quantity: 7, month: 12 }).ok).toBe(false);
    expect(extraPay({ kind: "greatness_report", quantity: 7, month: 5 }).ok).toBe(false);
  });

  it("pays $15 a conference, and only in December and May", () => {
    expect((extraPay({ kind: "parent_conference", quantity: 4, month: 12 }) as { cents: number }).cents)
      .toBe(6_000);
    expect((extraPay({ kind: "parent_conference", quantity: 4, month: 5 }) as { cents: number }).cents)
      .toBe(6_000);
    expect(extraPay({ kind: "parent_conference", quantity: 4, month: 9 }).ok).toBe(false);
  });

  /** The two rules are a pair: the conference months are exactly the months
   *  GREATNESS Reports are not written. Neither month pays both. */
  it("never pays a report and a conference in the same month", () => {
    for (const month of [12, 5]) {
      expect(extraPay({ kind: "greatness_report", quantity: 1, month }).ok).toBe(false);
      expect(extraPay({ kind: "parent_conference", quantity: 1, month }).ok).toBe(true);
    }
    for (const month of [9, 1, 6]) {
      expect(extraPay({ kind: "greatness_report", quantity: 1, month }).ok).toBe(true);
      expect(extraPay({ kind: "parent_conference", quantity: 1, month }).ok).toBe(false);
    }
  });

  it("pays a meeting and a coaching session once a month each", () => {
    expect((extraPay({ kind: "teacher_meeting", quantity: 1, month: 9 }) as { cents: number }).cents)
      .toBe(1_500);
    expect((extraPay({ kind: "coaching_session", quantity: 1, month: 9 }) as { cents: number }).cents)
      .toBe(1_500);
  });

  it("caps a second meeting in the same month", () => {
    const second = extraPay({
      kind: "teacher_meeting", quantity: 1, month: 9, alreadyClaimedThisMonth: 1,
    });
    expect(second.ok).toBe(false);
  });

  /** Claiming three at once must pay one, not three. The cap has to bite on
   *  the quantity as well as on the second call. */
  it("pays only one when three are claimed at once", () => {
    const many = extraPay({ kind: "coaching_session", quantity: 3, month: 9 });
    expect(many.ok).toBe(true);
    if (!many.ok) return;
    expect(many.cents).toBe(1_500);
    expect(many.quantityPaid).toBe(1);
  });

  it("pays $15 an hour for additional work, part hours included", () => {
    expect((extraPay({ kind: "additional_hour", quantity: 2.5, month: 9 }) as { cents: number }).cents)
      .toBe(3_750);
  });

  it("refuses half a meeting and a thirteenth month", () => {
    expect(extraPay({ kind: "teacher_meeting", quantity: 0.5, month: 9 }).ok).toBe(false);
    expect(extraPay({ kind: "greatness_report", quantity: 1, month: 13 }).ok).toBe(false);
  });
});

describe("the two personal rates", () => {
  it("pays Craig Mann $30 an hour with Ivy Ash", () => {
    const p = hourlyPay(CRAIG_MANN_IVY_ASH_TUTORING, 3);
    expect(p.ok && p.cents).toBe(9_000);
  });

  it("pays Katie Vetere $20 an hour for Approved Admin Work", () => {
    const p = hourlyPay(KATIE_VETERE_ADMIN, 20);
    expect(p.ok && p.cents).toBe(40_000);
  });

  it("accepts a zero-hour week from Katie rather than refusing it", () => {
    const p = hourlyPay(KATIE_VETERE_ADMIN, 0);
    expect(p.ok && p.cents).toBe(0);
  });

  it("refuses more than the 20 hours Katie may submit", () => {
    expect(hourlyPay(KATIE_VETERE_ADMIN, 21).ok).toBe(false);
  });

  it("does not cap Craig, who has no weekly limit", () => {
    expect(hourlyPay(CRAIG_MANN_IVY_ASH_TUTORING, 25).ok).toBe(true);
  });
});

describe("a whole week", () => {
  const week = weekTotals({
    classes: [
      { campus: "virtual", scheduledStudents: 4, structuredLiteracy: false, absentStudents: 2, guest: false },
      { campus: "virtual", scheduledStudents: 3, structuredLiteracy: true,  absentStudents: 0, guest: false },
      { campus: "hs",      scheduledStudents: 2, structuredLiteracy: false, absentStudents: 1, guest: true  },
    ],
    extras: [{ kind: "teacher_meeting", quantity: 1, month: 9 }],
    hourly: [{ rate: KATIE_VETERE_ADMIN, hours: 2 }],
  });

  it("adds the classes up", () => {
    // 3500 (4 students) + 4500 (SL, 3 students) + 2500 (2 students) = 10500
    expect(week.classCents).toBe(10_500);
  });

  it("splits the week by campus, per item 23", () => {
    expect(week.virtualCents).toBe(8_000);
    expect(week.hsCents).toBe(2_500);
  });

  /** Extras and hourly work are taught at neither campus. Reporting them
   *  separately is what makes the two campus figures add up to the week. */
  it("keeps extras and hourly work out of the campus split, and still balances", () => {
    expect(week.unattributedCents).toBe(1_500 + 4_000);
    expect(week.virtualCents + week.hsCents + week.unattributedCents).toBe(week.totalCents);
    expect(week.totalCents).toBe(16_000);
  });

  it("counts what Jimmy's view needs, per item 22", () => {
    expect(week.classCount).toBe(3);
    expect(week.guestCount).toBe(1);
    expect(week.studentsScheduled).toBe(9);
    expect(week.studentsAbsent).toBe(3);
  });

  /** A guest class at the same roster size earns the same as a scheduled one.
   *  The old model paid guests $5 less at the base; Jimmy dropped that. */
  it("pays a guest exactly what it pays the usual teacher", () => {
    const asGuest = weekTotals({
      classes: [{ campus: "hs", scheduledStudents: 5, structuredLiteracy: true, absentStudents: 0, guest: true }],
      extras: [], hourly: [],
    });
    const asScheduled = weekTotals({
      classes: [{ campus: "hs", scheduledStudents: 5, structuredLiteracy: true, absentStudents: 0, guest: false }],
      extras: [], hourly: [],
    });
    expect(asGuest.totalCents).toBe(asScheduled.totalCents);
    expect(asGuest.totalCents).toBe(5_500);
  });

  /** One bad entry must not cost the teacher the rest of the week. */
  it("prices what it can and names what it cannot", () => {
    const messy = weekTotals({
      classes: [
        { campus: "virtual", scheduledStudents: 4, structuredLiteracy: false, absentStudents: 0, guest: false },
        { campus: "virtual", scheduledStudents: -3, structuredLiteracy: false, absentStudents: 0, guest: false },
      ],
      extras: [{ kind: "parent_conference", quantity: 2, month: 9 }],
      hourly: [],
    });
    expect(messy.classCents).toBe(3_500);
    expect(messy.refusals).toHaveLength(2);
    expect(messy.totalCents).toBe(3_500);
  });

  it("an empty week is zero, not an error", () => {
    const none = weekTotals({ classes: [], extras: [], hourly: [] });
    expect(none.totalCents).toBe(0);
    expect(none.refusals).toHaveLength(0);
  });
});
