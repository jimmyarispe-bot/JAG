import { describe, expect, it } from "vitest";
import {
  ADMISSIONS_CASE_PROFILE_SECTIONS,
  extractQuestionLabels,
} from "@/lib/admissions/profile/sections";
import { userHasAnyPermission } from "@/lib/platform/profile/access";

/**
 * THE FAMILY'S OWN WORDS, ON THE CHILD'S CARD.
 *
 * Until 17 September 2026 there was nowhere in JAG to read a family's inquiry
 * form. The answers had been stored since migration 223; one function read
 * them, returned two of them, and fed only the Decisions screen — so what a
 * parent wrote about their child was visible while a decision was open and
 * disappeared the moment somebody answered it.
 *
 * `admissions_leads.notes` was worse: the September import wrote GREATNESS and
 * challenges there for 300-odd families and nothing rendered the column at all.
 */

const SCHOOL_LEADER = [
  "ACADEMYOS_ACCESS",
  "admissions.view",
  "admissions.manage",
  "admissions.accept",
  "students.view",
];

function section(key: string) {
  const s = ADMISSIONS_CASE_PROFILE_SECTIONS.find((x) => x.key === key);
  if (!s) throw new Error(`no ${key} section registered`);
  return s;
}

describe("the interest form section", () => {
  const interest = section("interest_form");

  /** THE ONE THAT MATTERS: the people running admissions can read it. */
  it("is visible to a School Leader", () => {
    expect(userHasAnyPermission(SCHOOL_LEADER, [...interest.permissions])).toBe(true);
  });

  /**
   * It is a family's words, not their money. If this ever needs a funding key
   * something has gone wrong with what the section renders.
   */
  it("does not require a money permission", () => {
    expect(
      interest.permissions.some((p) => /fund|financ|scholarship/.test(p))
    ).toBe(false);
  });

  /**
   * Still the same intent - near the front, beside the family, not buried at
   * the end where it sat when it shipped thirteenth, after Activity.
   *
   * The numbers moved on 17 September when the tab strip went flat and started
   * running in the order the admissions process runs, so Pipeline now sorts
   * ahead of the interest form. Comparing against whatever happens to be second
   * was pinning the old layout rather than the property, so this asserts the
   * property: it is next to the family, and it comes before the application.
   * Full ordering lives in case-tab-order.test.ts.
   */
  it("sits with the family, not at the end of the card", () => {
    const ordered = [...ADMISSIONS_CASE_PROFILE_SECTIONS].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)
    );
    const at = (key: string) => ordered.findIndex((s) => s.key === key);

    expect(Math.abs(at("interest_form") - at("prospect"))).toBe(1);
    expect(at("interest_form")).toBeLessThan(at("applications"));
  });
});

/**
 * Labels come out of the form version's `definition` jsonb, whose shape is
 * owned by the form builder and has changed from v1 to v20. The extractor walks
 * it rather than assuming a path, so these cases are the shapes it must survive.
 */
describe("reading question labels out of a form definition", () => {
  it("finds a label beside a key", () => {
    const def = { questions: [{ key: "student_greatness", label: "What is your child GREAT at?" }] };
    expect(extractQuestionLabels(def).student_greatness).toBe("What is your child GREAT at?");
  });

  it("finds labels nested inside groups", () => {
    const def = {
      pages: [{ groups: [{ fields: [{ id: "student_challenges", question: "What frustrates them?" }] }] }],
    };
    expect(extractQuestionLabels(def).student_challenges).toBe("What frustrates them?");
  });

  it("accepts the other spellings the builder has used", () => {
    expect(extractQuestionLabels({ key: "a", title: "A title" }).a).toBe("A title");
    expect(extractQuestionLabels({ question_key: "b", prompt: "A prompt" }).b).toBe("A prompt");
  });

  /** A definition it cannot read must yield nothing, not crash the card. */
  it.each([null, undefined, 42, "text", {}, []])("survives %s", (def) => {
    expect(extractQuestionLabels(def)).toEqual({});
  });

  it("does not hang on a definition that references itself", () => {
    const def: Record<string, unknown> = { key: "x", label: "X" };
    def.self = def;
    expect(extractQuestionLabels(def).x).toBe("X");
  });

  it("ignores an entry with a key but no label", () => {
    expect(extractQuestionLabels({ questions: [{ key: "nolabel" }] })).toEqual({});
  });
});
