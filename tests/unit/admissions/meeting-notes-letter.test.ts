/**
 * "Meeting w/ parent ... happening now; TAKE notes" — the four merge fields
 * that letter needed and the platform did not have.
 *
 * Each one of these renders into an email a school leader reads thirty
 * seconds before she speaks to a parent. A token that renders wrong is worse
 * than one that renders nothing: she acts on it.
 */

import { describe, expect, it } from "vitest";

import { buildMergeValues } from "@/lib/admissions/communications/merge-fields";
import { MERGE_FIELDS } from "@/lib/admissions/communications/types";

const NEW_FIELDS = [
  "student_full_name",
  "student_grade",
  "student_age",
  "meeting_link",
] as const;

describe("the letter's tokens are registered", () => {
  it("all four are in MERGE_FIELDS, so none mails literal braces", () => {
    /* This list is what migration 296's audit compares template bodies
       against. A token in a body with no entry here is the 294 failure. */
    for (const field of NEW_FIELDS) {
      expect(MERGE_FIELDS).toContain(field);
    }
  });
});

describe("student_full_name", () => {
  it("is first and last", () => {
    const v = buildMergeValues({ studentFirstName: "Beatrice", studentLastName: "Okonkwo" });
    expect(v.student_full_name).toBe("Beatrice Okonkwo");
  });

  it("ignores the preferred name, unlike student_name", () => {
    /* The whole reason this field exists. "Birdie" is what her family calls
       her and what a letter to them should say; it does not find her in
       anybody's records. */
    const ctx = {
      studentFirstName: "Beatrice",
      studentLastName: "Okonkwo",
      preferredName: "Birdie",
    };
    expect(buildMergeValues(ctx).student_full_name).toBe("Beatrice Okonkwo");
    expect(buildMergeValues(ctx).student_name).toBe("Birdie");
  });

  it("falls back rather than rendering an empty line", () => {
    expect(buildMergeValues({}).student_full_name).toBe("your student");
  });
});

describe("student_age", () => {
  function isoYearsAgo(years: number, monthOffset = 0): string {
    const d = new Date();
    d.setFullYear(d.getFullYear() - years);
    d.setMonth(d.getMonth() + monthOffset);
    return d.toISOString().slice(0, 10);
  }

  it("is whole years, as a number a person can read", () => {
    expect(buildMergeValues({ dateOfBirth: isoYearsAgo(9) })).toMatchObject({
      student_age: "9",
    });
  });

  it("has not had this year's birthday yet", () => {
    /* Born ten years ago but two months from now: still nine. */
    expect(buildMergeValues({ dateOfBirth: isoYearsAgo(10, 2) })).toMatchObject({
      student_age: "9",
    });
  });

  it('says "not given" rather than leaving a blank line', () => {
    expect(buildMergeValues({}).student_age).toBe("not given");
    expect(buildMergeValues({ dateOfBirth: "   " }).student_age).toBe("not given");
  });

  it("refuses nonsense instead of printing a negative child", () => {
    expect(buildMergeValues({ dateOfBirth: "not a date" }).student_age).toBe("not given");
    expect(buildMergeValues({ dateOfBirth: "2099-01-01" }).student_age).toBe("not given");
  });
});

describe("student_grade", () => {
  it("renders a label, not the stored code", () => {
    const rendered = buildMergeValues({ grade: "3" }).student_grade;
    expect(rendered).toBeTruthy();
    expect(rendered).not.toBe("");
  });

  it("does not throw on a missing grade", () => {
    expect(() => buildMergeValues({})).not.toThrow();
  });
});

describe("meeting_link", () => {
  it("renders the Google Meet link when the appointment has one", () => {
    const url = "https://meet.google.com/abc-defg-hij";
    expect(buildMergeValues({ meetingLink: url }).meeting_link).toBe(url);
  });

  it("is empty at a campus whose inquiry call is a telephone call", () => {
    /* GA and FL. Google creates no conference for a phone appointment, so
       the line at the foot of the letter is simply blank - which is correct,
       because the sentence above it says "Call them OR go to the google
       meets link". */
    expect(buildMergeValues({}).meeting_link).toBe("");
  });
});
