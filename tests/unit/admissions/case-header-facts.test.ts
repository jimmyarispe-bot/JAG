import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A CHILD'S CARD ANSWERS THE OBVIOUS QUESTIONS WITHOUT A CLICK.
 *
 * 17 September 2026. The header carried a name, a stage label and a stage
 * badge. Everything staff actually open a case to do - ring the parent, check
 * the campus, check the grade - lived on a tab, so the phone number was four
 * clicks from the name on a card whose entire subject is that child.
 *
 * School, grade, preferred start date, parent name, parent email and parent
 * phone now ride on the envelope and render in the header, which means they are
 * there on EVERY section rather than only on Prospective Family.
 *
 * Source assertions, because the fault is an absence: there was no wrong value,
 * only fields nobody had put on the screen.
 */

const root = join(__dirname, "..", "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

const envelope = read("src/lib/admissions/profile/envelope.ts");
const header = read("src/components/admissions/case/AdmissionsCaseHeaderExtras.tsx");

describe("the envelope carries the facts", () => {
  it.each([
    "guardian_phone",
    "guardian_first_name",
    "guardian_last_name",
    "applying_for_grade",
  ])("selects %s off the lead", (column) => {
    expect(envelope).toContain(column);
  });

  /** No column holds it — it is the interest form's own answer. */
  it("looks up the preferred start date from the interest answers", () => {
    expect(envelope).toContain("desired_start_date");
    expect(envelope).toContain("admissions_interest_answers");
  });

  it("scopes that lookup to this lead", () => {
    expect(
      envelope,
      "the start-date answer is not scoped to the lead — a card could show another family's date"
    ).toContain("admissions_interest_submissions.lead_id");
  });
});

describe("the header shows them", () => {
  it.each([
    ["school", "schoolName"],
    ["grade", "applyingForGrade"],
    ["start date", "desiredStartDate"],
    ["parent name", "guardianName"],
    ["parent email", "guardianEmail"],
    ["parent phone", "guardianPhone"],
  ])("renders the %s", (_label, field) => {
    expect(header).toContain(field);
  });

  /** A number you have to retype is a number that gets retyped wrong. */
  it("makes the phone dial and the email open", () => {
    expect(header).toContain("tel:");
    expect(header).toContain("mailto:");
  });

  /**
   * A row reading "Grade —  Start —  Phone —" looks like a broken screen. An
   * absent field reads as what it is: a family who has not told us yet.
   */
  it("omits an empty field rather than printing a dash", () => {
    expect(header).not.toMatch(/\{envelope\.\w+ \?\? "[—-]"\}/);
  });
});
