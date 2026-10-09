import { describe, expect, it } from "vitest";

import { KATIE_VETERE_ADMIN } from "@/lib/finance/teacher-pay/rates";
import {
  payrollWeek,
  studentLabel,
  teacherWeekView,
  usd,
  type ClassRow,
} from "@/lib/finance/teacher-pay/week-view";

function child(name: string, school: "virtual" | "ga" | "fl" | "hs" | null, absent = false) {
  return { studentId: name, name, school, absent };
}

const monday = "2026-09-28";

function classRow(over: Partial<ClassRow> = {}): ClassRow {
  return {
    entryId: "e1",
    courseName: "DigitLab",
    campus: "virtual",
    classDate: monday,
    startTimeEt: "13:00",
    isGuest: false,
    guestForName: null,
    structuredLiteracy: false,
    students: [child("A", "virtual"), child("B", "ga"), child("C", "fl")],
    ...over,
  };
}

describe("a child's name says which school they belong to", () => {
  it("labels each of the four", () => {
    /* "AV", not "Virtual" - Jimmy, 2 October: "for school of record,
       display them like this - Jimmy Arispe (AV)". The roll is headed AV
       and a teacher reading a class list should see the same four letters
       the roll uses. */
    expect(studentLabel("Ada Lovelace", "virtual")).toBe("Ada Lovelace (AV)");
    expect(studentLabel("Ada Lovelace", "ga")).toBe("Ada Lovelace (GA)");
    expect(studentLabel("Ada Lovelace", "fl")).toBe("Ada Lovelace (FL)");
    expect(studentLabel("Ada Lovelace", "hs")).toBe("Ada Lovelace (HS)");
  });

  /**
   * A child with no school must not read as belonging to the teacher's own.
   * On 21 September exactly that assumption priced a class of four as zero.
   */
  it("says so when no school is recorded, rather than guessing", () => {
    expect(studentLabel("Ada Lovelace", null)).toBe("Ada Lovelace (no school recorded)");
  });

  it("does not produce an empty name", () => {
    expect(studentLabel("   ", "hs")).toBe("(unnamed student) (HS)");
  });
});

describe("a teacher's week", () => {
  it("prices each class and labels every child", () => {
    const week = teacherWeekView({
      weekStart: monday, status: "open", classes: [classRow()], extras: [], hourly: [],
    });
    expect(week.lines).toHaveLength(1);
    expect(week.lines[0].cents).toBe(3_000); // 20 + 5 + 5
    expect(week.lines[0].scheduled).toBe(3);
    expect(week.lines[0].studentLabels).toEqual(["A (AV)", "B (GA)", "C (FL)"]);
  });

  it("counts absences without letting them touch the pay", () => {
    const week = teacherWeekView({
      weekStart: monday, status: "open",
      classes: [classRow({ students: [child("A", "virtual"), child("B", "ga", true), child("C", "fl", true)] })],
      extras: [], hourly: [],
    });
    expect(week.lines[0].absent).toBe(2);
    expect(week.lines[0].scheduled).toBe(3);
    expect(week.lines[0].cents).toBe(3_000);
  });

  it("says scheduled or guest, and who the guest covered", () => {
    const week = teacherWeekView({
      weekStart: monday, status: "open",
      classes: [classRow({ isGuest: true, guestForName: "Jessica Vedder" })],
      extras: [], hourly: [],
    });
    expect(week.lines[0].kind).toBe("Guest teaching");
    expect(week.lines[0].guestForName).toBe("Jessica Vedder");
  });

  it("splits the week by campus and balances against the total", () => {
    const week = teacherWeekView({
      weekStart: monday, status: "open",
      classes: [
        classRow({ entryId: "a", campus: "virtual" }),
        classRow({ entryId: "b", campus: "hs", structuredLiteracy: true, startTimeEt: "14:00" }),
      ],
      extras: [{ kind: "teacher_meeting", quantity: 1, month: 9 }],
      hourly: [{ rate: KATIE_VETERE_ADMIN, hours: 2 }],
    });
    expect(week.virtualCents).toBe(3_000);
    expect(week.hsCents).toBe(4_500);
    expect(week.unattributedCents).toBe(1_500 + 4_000);
    expect(week.virtualCents + week.hsCents + week.unattributedCents).toBe(week.totalCents);
  });

  /** A short total with no explanation is the failure this avoids. */
  it("still shows a line it could not price, with the reason", () => {
    const week = teacherWeekView({
      weekStart: monday, status: "open",
      classes: [classRow()],
      extras: [{ kind: "parent_conference", quantity: 2, month: 9 }],
      hourly: [],
    });
    expect(week.extras).toHaveLength(1);
    expect(week.extras[0].cents).toBe(0);
    expect(week.extras[0].problem).toMatch(/only paid in December and May/);
    expect(week.problems).toHaveLength(1);
  });

  it("carries the kooky note through", () => {
    const week = teacherWeekView({
      weekStart: monday, status: "open", classes: [], extras: [], hourly: [],
      kookyNote: "The fire alarm went off twice on Wednesday.",
    });
    expect(week.kookyNote).toBe("The fire alarm went off twice on Wednesday.");
    expect(week.totalCents).toBe(0);
  });
});

describe("what Jimmy reads", () => {
  function teacher(name: string, cents: number, status: "open" | "submitted" = "submitted") {
    const students = Array.from({ length: cents / 500 }, (_, i) => child(`S${i}`, "virtual"));
    return {
      employeeId: name,
      teacherName: name,
      week: teacherWeekView({
        weekStart: monday, status,
        classes: [classRow({ students, startTimeEt: "09:00" })],
        extras: [], hourly: [],
      }),
    };
  }

  /**
   * THE ORDER IS THE CONTROL. This roll-up is the only check on a model where
   * the teacher picks both the class and the roster that sets their own pay.
   * Alphabetical hides the outlier; largest-first puts it on line one.
   */
  it("puts the biggest week first", () => {
    const roll = payrollWeek({
      weekStart: monday,
      teachers: [teacher("Amos", 2_000), teacher("Zora", 6_000), teacher("Mira", 4_000)],
    });
    expect(roll.teachers.map((t) => t.teacherName)).toEqual(["Zora", "Mira", "Amos"]);
  });

  it("adds every teacher into one week total, split by campus", () => {
    const roll = payrollWeek({
      weekStart: monday,
      teachers: [teacher("Amos", 2_000), teacher("Zora", 6_000)],
    });
    expect(roll.totalCents).toBe(roll.teachers.reduce((n, t) => n + t.totalCents, 0));
    expect(roll.virtualCents + roll.hsCents + roll.unattributedCents).toBe(roll.totalCents);
  });

  /** Paying a week nobody submitted is the mistake this number prevents. */
  it("counts the weeks still open rather than hiding them", () => {
    const roll = payrollWeek({
      weekStart: monday,
      teachers: [teacher("Amos", 2_000, "open"), teacher("Zora", 6_000, "submitted")],
    });
    expect(roll.openCount).toBe(1);
  });

  it("names every teacher whose week has something unpriceable", () => {
    const broken = {
      employeeId: "Nia", teacherName: "Nia",
      week: teacherWeekView({
        weekStart: monday, status: "submitted", classes: [],
        extras: [{ kind: "greatness_report", quantity: 3, month: 12 }], hourly: [],
      }),
    };
    const roll = payrollWeek({ weekStart: monday, teachers: [broken, teacher("Zora", 2_000)] });
    expect(roll.withProblems).toEqual(["Nia"]);
  });

  it("keeps each teacher's classes, so a week can be read and not only totalled", () => {
    const roll = payrollWeek({ weekStart: monday, teachers: [teacher("Zora", 4_000)] });
    expect(roll.teachers[0].lines).toHaveLength(1);
    expect(roll.teachers[0].lines[0].courseName).toBe("DigitLab");
  });

  it("an empty payroll is zero, not an error", () => {
    const roll = payrollWeek({ weekStart: monday, teachers: [] });
    expect(roll.totalCents).toBe(0);
    expect(roll.openCount).toBe(0);
  });
});

describe("money reads the same everywhere", () => {
  it("formats cents as dollars", () => {
    expect(usd(3_500)).toBe("$35.00");
    expect(usd(0)).toBe("$0.00");
    expect(usd(123_456)).toBe("$1,234.56");
  });
});
