import { describe, expect, it } from "vitest";
import {
  grossForClass,
  onRosterOn,
  rateOn,
  totalsByTeacher,
  type ClassPayRow,
  type ClassRate,
  type EnrollmentWindow,
} from "@/lib/finance/class-pay";

/**
 * WHAT A TEACHER IS OWED.
 *
 * The rule: a rate per student ENROLLED in the section, for every class taught.
 * Attendance is recorded for the family and does not change the pay - a child
 * who did not turn up was still taught for.
 *
 * The subtle half is WHICH roster. If the count came from today's enrolment
 * list, recalculating August after a student drops in October would quietly
 * reduce what a teacher was already paid, and nothing would show that it had
 * changed. The count is therefore the roster as it stood ON THE DAY, so a
 * period recalculated in December returns exactly what it returned in August.
 *
 * This is money owed to a person, so the rule is a pure function and it is
 * tested directly rather than inferred from a screen.
 */

const enrolment = (
  enrolledAt: string,
  droppedAt: string | null = null,
  status = "enrolled"
): EnrollmentWindow => ({ enrolledAt, droppedAt, status });

describe("who was on the roster that day", () => {
  it("counts a student enrolled before the class", () => {
    expect(onRosterOn(enrolment("2026-08-01"), "2026-09-15")).toBe(true);
  });

  it("does not count a student who enrolled afterwards", () => {
    expect(onRosterOn(enrolment("2026-10-01"), "2026-09-15")).toBe(false);
  });

  it("counts a student who enrolled that same day", () => {
    expect(onRosterOn(enrolment("2026-09-15"), "2026-09-15")).toBe(true);
  });

  it("does not count a student who had already dropped", () => {
    expect(onRosterOn(enrolment("2026-08-01", "2026-09-01"), "2026-09-15")).toBe(false);
  });

  /** They were taught that morning. */
  it("counts a student who dropped on the day of the class", () => {
    expect(onRosterOn(enrolment("2026-08-01", "2026-09-15"), "2026-09-15")).toBe(true);
  });

  it("counts a student who dropped later", () => {
    expect(onRosterOn(enrolment("2026-08-01", "2026-12-01"), "2026-09-15")).toBe(true);
  });

  it.each(["waitlisted", "pending", "dropped"])("does not count a %s student", (status) => {
    expect(onRosterOn(enrolment("2026-08-01", null, status), "2026-09-15")).toBe(false);
  });

  it("counts a student who completed the course", () => {
    expect(onRosterOn(enrolment("2026-08-01", null, "completed"), "2026-09-15")).toBe(true);
  });

  /**
   * THE ONE THAT MATTERS: the same class, asked about twice, months apart.
   * A drop in October must not change what August paid.
   */
  it("gives the same answer after the student later drops", () => {
    const august = enrolment("2026-08-01");
    const afterDrop = enrolment("2026-08-01", "2026-10-05");
    expect(onRosterOn(august, "2026-09-15")).toBe(onRosterOn(afterDrop, "2026-09-15"));
  });

  it("handles a timestamp, not just a date", () => {
    expect(onRosterOn(enrolment("2026-09-15T14:00:00Z"), "2026-09-15")).toBe(true);
  });
});

/** From the pay schedule of 18 September 2026. */
const LITLAB: ClassRate = {
  baseFirstStudent: 20,
  perAdditionalStudent: 5,
  guestBaseFirstStudent: 15,
};
const STRUCTURED_LITERACY: ClassRate = {
  baseFirstStudent: 35,
  perAdditionalStudent: 5,
  guestBaseFirstStudent: 30,
};

describe("what a class pays", () => {
  /** The shape of the schedule: a base for the first, then five a head. */
  it("pays the base for a class of one", () => {
    expect(grossForClass(LITLAB, 1)).toBe(20);
  });

  it("adds five for every student beyond the first", () => {
    expect(grossForClass(LITLAB, 6)).toBe(45);
  });

  /**
   * THE ONE THAT MATTERS. A flat rate per head would pay 120 for this class
   * instead of 45 - nearly triple, on every class, for twelve teachers.
   */
  it("is not a flat rate per head", () => {
    expect(grossForClass(LITLAB, 6)).not.toBe(6 * LITLAB.baseFirstStudent);
  });

  it("prices Structured Literacy at its own higher base", () => {
    expect(grossForClass(STRUCTURED_LITERACY, 1)).toBe(35);
    expect(grossForClass(STRUCTURED_LITERACY, 4)).toBe(50);
  });

  it("pays a guest the lower base and the same per student", () => {
    expect(grossForClass(LITLAB, 1, true)).toBe(15);
    expect(grossForClass(LITLAB, 6, true)).toBe(40);
  });

  it("pays a guest on Structured Literacy its own guest base", () => {
    expect(grossForClass(STRUCTURED_LITERACY, 1, true)).toBe(30);
  });

  /** The money starts at the first child; the class still appears at zero. */
  it("pays nothing for a class nobody was enrolled in", () => {
    expect(grossForClass(LITLAB, 0)).toBe(0);
    expect(grossForClass(LITLAB, 0, true)).toBe(0);
  });

  it("rounds to the penny", () => {
    expect(grossForClass({ ...LITLAB, perAdditionalStudent: 3.33 }, 4)).toBe(29.99);
  });
});

describe("the rate in force on the day", () => {
  const ANYONE = null;
  const CRAIG = "craig-employee-id";
  const SOMEBODY_ELSE = "other-employee-id";

  const rates = [
    { ...LITLAB, effectiveFrom: "2026-09-01", employeeId: ANYONE },
    { ...LITLAB, baseFirstStudent: 25, effectiveFrom: "2027-01-01", employeeId: ANYONE },
  ];

  it("uses the rate that had started", () => {
    expect(rateOn(rates, "2026-10-15", CRAIG)?.baseFirstStudent).toBe(20);
  });

  it("uses the newer rate after it starts", () => {
    expect(rateOn(rates, "2027-02-01", CRAIG)?.baseFirstStudent).toBe(25);
  });

  it("uses a rate starting on the day itself", () => {
    expect(rateOn(rates, "2027-01-01", CRAIG)?.baseFirstStudent).toBe(25);
  });

  /**
   * A class before any rate existed has no price. Returning null means no pay
   * row and a named gap, rather than a row worth nothing.
   */
  it("has no rate before the first one starts", () => {
    expect(rateOn(rates, "2026-08-01", CRAIG)).toBeNull();
  });

  /**
   * THE REASON RATES ARE VERSIONED. A rise in January must not retroactively
   * change what September paid.
   */
  it("does not let a later rate rewrite an earlier period", () => {
    const before = rateOn([rates[0]], "2026-10-15", CRAIG)?.baseFirstStudent;
    const after = rateOn(rates, "2026-10-15", CRAIG)?.baseFirstStudent;
    expect(after).toBe(before);
  });

  /**
   * CRAIG MANN TUTORS AT 30.00 WHERE TUTORING PAYS 20.00.
   *
   * Jimmy, 19 September 2026: "when craig mann meets with ivy he is paid $30
   * per session", and "all tutoring except craig mann and ivy is the same
   * rate". The course rate must not quietly overwrite what one person was
   * promised, and one person's rate must not leak onto everybody.
   */
  describe("a rate that belongs to one person", () => {
    const tutoring = [
      { baseFirstStudent: 20, perAdditionalStudent: 0, guestBaseFirstStudent: 20,
        effectiveFrom: "2026-09-01", employeeId: ANYONE },
      { baseFirstStudent: 30, perAdditionalStudent: 0, guestBaseFirstStudent: 30,
        effectiveFrom: "2026-09-01", employeeId: CRAIG },
    ];

    it("pays the person their own rate", () => {
      expect(rateOn(tutoring, "2026-10-15", CRAIG)?.baseFirstStudent).toBe(30);
    });

    it("pays everybody else the course rate", () => {
      expect(rateOn(tutoring, "2026-10-15", SOMEBODY_ELSE)?.baseFirstStudent).toBe(20);
    });

    it("does not hand one person's rate to another", () => {
      const craigOnly = [tutoring[1]];
      expect(rateOn(craigOnly, "2026-10-15", SOMEBODY_ELSE)).toBeNull();
    });

    /* A person's rate wins even when the course rate is newer - otherwise a
       course-wide rise would silently cancel an individual agreement. */
    it("beats a newer course rate", () => {
      const withRise = [
        ...tutoring,
        { baseFirstStudent: 40, perAdditionalStudent: 0, guestBaseFirstStudent: 40,
          effectiveFrom: "2027-01-01", employeeId: ANYONE },
      ];
      expect(rateOn(withRise, "2027-02-01", CRAIG)?.baseFirstStudent).toBe(30);
      expect(rateOn(withRise, "2027-02-01", SOMEBODY_ELSE)?.baseFirstStudent).toBe(40);
    });
  });
});

describe("what each teacher is owed for the period", () => {
  const row = (employeeId: string, teacherName: string, students: number, gross: number) =>
    ({
      sessionId: `s-${Math.random()}`,
      employeeId,
      teacherName,
      schoolId: "school-1",
      schoolName: "The Academy Virtual",
      courseName: "Reading",
      sectionCode: "A",
      classDate: "2026-09-15",
      studentCount: students,
      ratePerStudent: 10,
      isGuest: false,
      gross,
    }) as ClassPayRow;

  it("adds up a teacher's classes", () => {
    const totals = totalsByTeacher([
      row("e1", "Ana Reed", 5, 50),
      row("e1", "Ana Reed", 3, 30),
    ]);
    expect(totals).toHaveLength(1);
    expect(totals[0].classes).toBe(2);
    expect(totals[0].students).toBe(8);
    expect(totals[0].gross).toBe(80);
  });

  it("keeps two teachers apart", () => {
    const totals = totalsByTeacher([
      row("e1", "Ana Reed", 5, 50),
      row("e2", "Ben Cole", 4, 40),
    ]);
    expect(totals.map((t) => t.teacherName)).toEqual(["Ana Reed", "Ben Cole"]);
  });

  /** Money summed in floating point drifts. A pay run must not. */
  it("does not accumulate rounding error", () => {
    const totals = totalsByTeacher([
      row("e1", "Ana Reed", 1, 0.1),
      row("e1", "Ana Reed", 1, 0.2),
    ]);
    expect(totals[0].gross).toBe(0.3);
  });

  it("is empty for a period with no classes", () => {
    expect(totalsByTeacher([])).toEqual([]);
  });
});
