import { describe, expect, it } from "vitest";
import {
  describeGaps,
  FIELD_LABELS,
  FAMILY_FIELDS,
  STUDENT_FIELDS,
  type RequestedFields,
} from "@/lib/people/completeness-shared";
import { renderInfoRequestEmail } from "@/lib/people/info-requests";

const requested: RequestedFields = {
  students: [
    { id: "s1", name: "Ava Caplan", fields: ["date_of_birth", "grade_level"] },
    { id: "s2", name: "Noah Caplan", fields: ["date_of_birth"] },
  ],
  family: ["phone", "address"],
  familyName: "Caplan Family",
};

describe("what we tell a parent is missing", () => {
  it("names each field against the child it belongs to", () => {
    const summary = describeGaps(requested);
    expect(summary).toContain("date of birth for Ava Caplan");
    expect(summary).toContain("date of birth for Noah Caplan");
    expect(summary).toContain("phone number");
    // Reads as a sentence, not a list of columns.
    expect(summary).toMatch(/ and /);
  });

  it("says nothing when nothing is missing", () => {
    expect(describeGaps({ students: [], family: [] })).toBe("");
  });

  it("every field has a label — an unlabelled field would reach a parent as a key", () => {
    for (const field of [...STUDENT_FIELDS, ...FAMILY_FIELDS]) {
      expect(FIELD_LABELS[field]).toBeTruthy();
      expect(FIELD_LABELS[field]).not.toMatch(/_/);
    }
  });
});

describe("the email itself", () => {
  const link = "https://thejag.org/update/abc123abc123abc123";

  it("lists the missing fields in the body, not only behind the link", () => {
    const mail = renderInfoRequestEmail({
      schoolName: "The Academy HS",
      guardianName: "Amy Caplan",
      requested,
      link,
      reminder: false,
    });
    expect(mail.html).toContain("Ava Caplan");
    expect(mail.html).toContain("Noah Caplan");
    expect(mail.html).toContain("Home address");
    expect(mail.text).toContain("Date of birth — Ava Caplan");
    expect(mail.html).toContain(link);
    expect(mail.text).toContain(link);
  });

  it("escapes anything that came out of the database", () => {
    const mail = renderInfoRequestEmail({
      schoolName: '<script>alert(1)</script>',
      guardianName: null,
      requested: {
        students: [{ id: "s1", name: '"><img src=x onerror=alert(1)>', fields: ["grade_level"] }],
        family: [],
      },
      link,
      reminder: false,
    });
    // The strings still appear — as inert text. What must not survive is a
    // real tag: no unescaped `<` immediately followed by a tag name, anywhere.
    expect(mail.html).not.toMatch(/<script/i);
    expect(mail.html).not.toMatch(/<img/i);
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.html).toContain("&lt;img");
  });

  it("a reminder says the previous link is dead, because it is", () => {
    const mail = renderInfoRequestEmail({
      schoolName: "The Academy GA",
      guardianName: "Nadia",
      requested,
      link,
      reminder: true,
    });
    expect(mail.subject).toMatch(/Reminder/);
    expect(mail.text.toLowerCase()).toContain("no longer works");
  });
});
