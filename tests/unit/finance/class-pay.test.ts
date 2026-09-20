import { describe, expect, it } from "vitest";
import {
  grossForClass,
  attendanceDays,
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
  status = "enrolled",
  attendsDays = "M-F",
  campusStudent = false
): EnrollmentWindow => ({ enrolledAt, droppedAt, status, attendsDays, campusStudent });

describe("who was on the roster that day", () => {
  it("counts a student enrolled before the class", () => {
    expect(onRosterOn(enrolment("2026-08-01"), "2026-09-15", "09:00")).toBe(true);
  });

  it("does not count a student who enrolled afterwards", () => {
    expect(onRosterOn(enrolment("2026-10-01"), "2026-09-15", "09:00")).toBe(false);
  });

  it("counts a student who enrolled that same day", () => {
    expect(onRosterOn(enrolment("2026-09-15"), "2026-09-15", "09:00")).toBe(true);
  });

  it("does not count a student who had already dropped", () => {
    expect(onRosterOn(enrolment("2026-08-01", "2026-09-01"), "2026-09-15", "09:00")).toBe(false);
  });

  /** They were taught that morning. */
  it("counts a student who dropped on the day of the class", () => {
    expect(onRosterOn(enrolment("2026-08-01", "2026-09-15"), "2026-09-15", "09:00")).toBe(true);
  });

  it("counts a student who dropped later", () => {
    expect(onRosterOn(enrolment("2026-08-01", "2026-12-01"), "2026-09-15", "09:00")).toBe(true);
  });

  it.each(["waitlisted", "pending", "dropped"])("does not count a %s student", (status) => {
    expect(onRosterOn(enrolment("2026-08-01", null, status), "2026-09-15", "09:00")).toBe(false);
  });

  it("counts a student who completed the course", () => {
    expect(onRosterOn(enrolment("2026-08-01", null, "completed"), "2026-09-15", "09:00")).toBe(true);
  });

  /**
   * THE ONE THAT MATTERS: the same class, asked about twice, months apart.
   * A drop in October must not change what August paid.
   */
  it("gives the same answer after the student later drops", () => {
    const august = enrolment("2026-08-01");
    const afterDrop = enrolment("2026-08-01", "2026-10-05");
    expect(onRosterOn(august, "2026-09-15", "09:00")).toBe(onRosterOn(afterDrop, "2026-09-15", "09:00"));
  });

  it("handles a timestamp, not just a date", () => {
    expect(onRosterOn(enrolment("2026-09-15T14:00:00Z"), "2026-09-15", "09:00")).toBe(true);
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

/**
 * WHICH DAYS A CHILD COMES.
 *
 * Jimmy, 19 September 2026: "all are m-f unless they are marked at FL or GA
 * then those are campus students who are m-th", and "no this class isnt held if
 * they are all campus students and the teacher should not be paid for it".
 *
 * The class runs five days; a campus child attends four. There are thirteen
 * Fridays in the Fall term, so a class of eight with three campus children that
 * ignored this would be counted as eight on all thirteen - the teacher overpaid
 * thirteen times, invisibly, because the roster is right and only the day is
 * wrong.
 */
describe("which weekdays a child attends", () => {
  const days = (p: string) => [...attendanceDays(p)].sort();

  it("treats M-F, and anything blank, as the whole week", () => {
    expect(days("M-F")).toEqual([1, 2, 3, 4, 5]);
    expect(days("")).toEqual([1, 2, 3, 4, 5]);
  });

  it("reads a campus child as Monday to Thursday", () => {
    expect(days("M-Th")).toEqual([1, 2, 3, 4]);
  });

  /* Th must beat T, or Thursday silently becomes Tuesday and two teachers are
     paid the wrong amount on two different days. */
  it("reads Th as Thursday, not Tuesday", () => {
    expect(days("M/T/Th")).toEqual([1, 2, 4]);
    expect(days("T/Th")).toEqual([2, 4]);
  });

  it("does not care about case or spaces", () => {
    expect(days("m / t / th")).toEqual([1, 2, 4]);
  });

  /* A pattern nobody anticipated must produce a roster that is too BIG, which
     somebody notices, rather than a child who vanishes from every class, which
     nobody does. */
  it("falls back to the whole week rather than to nobody", () => {
    expect(days("banana")).toEqual([1, 2, 3, 4, 5]);
    expect(days("F-M")).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("a campus child on a Friday afternoon", () => {
  /**
   * Jimmy, 20 September 2026: "scratch fridays rule. campus kids do have class
   * on fridays. but not after 1pm."
   *
   * This replaces an earlier rule that had campus children absent for the whole
   * of Friday. That was wrong, and had it been acted on it would have deleted
   * 65 classes that do happen. What is true is narrower: they are in the
   * morning and gone by the afternoon.
   *
   * 13 of the 41 sections start at or after 13:00, across 13 Fridays - 169
   * classes where a campus child must not be counted.
   *
   * 2026-08-14 is a Friday; 2026-08-13 a Thursday; 2026-08-10 a Monday.
   */
  const campus = enrolment("2026-08-10", null, "enrolled", "M-F", true);
  const virtual = enrolment("2026-08-10", null, "enrolled", "M-F", false);

  it("is in a Friday MORNING class", () => {
    expect(onRosterOn(campus, "2026-08-14", "09:00")).toBe(true);
    expect(onRosterOn(campus, "2026-08-14", "12:00")).toBe(true);
  });

  /* The boundary is deliberate: "no class after 1pm" reads as the school day
     ending at one, so a one-o'clock class is not attended. */
  it("is NOT in a Friday class starting at one o'clock", () => {
    expect(onRosterOn(campus, "2026-08-14", "13:00")).toBe(false);
  });

  it("is NOT in any later Friday class", () => {
    expect(onRosterOn(campus, "2026-08-14", "14:00")).toBe(false);
    expect(onRosterOn(campus, "2026-08-14", "17:00")).toBe(false);
  });

  it("is in the same afternoon class on a Thursday", () => {
    expect(onRosterOn(campus, "2026-08-13", "17:00")).toBe(true);
  });

  it("leaves a non-campus child in every Friday class", () => {
    expect(onRosterOn(virtual, "2026-08-14", "13:00")).toBe(true);
    expect(onRosterOn(virtual, "2026-08-14", "17:00")).toBe(true);
  });

  /* Isla Fitzgerald's 12:00 Structured Literacy is marked M/T/Th on the grid -
     three days, nothing to do with campuses. Her own pattern still decides. */
  it("leaves an individual day pattern alone", () => {
    const isla = enrolment("2026-08-10", null, "enrolled", "M/T/Th", false);
    expect(onRosterOn(isla, "2026-08-10", "12:00")).toBe(true);   // Monday
    expect(onRosterOn(isla, "2026-08-12", "12:00")).toBe(false);  // Wednesday
    expect(onRosterOn(isla, "2026-08-13", "12:00")).toBe(true);   // Thursday
    expect(onRosterOn(isla, "2026-08-14", "12:00")).toBe(false);  // Friday
  });
});
