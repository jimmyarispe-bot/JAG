import { describe, expect, it } from "vitest";
import {
  definitionDeclaresPhases,
  isQuestionInPhase,
  validateInterestSubmission,
} from "@/lib/admissions/interest-form/definition";
import type {
  InterestFormDefinition,
  InterestQuestionDefinition,
  InterestSectionDefinition,
} from "@/lib/admissions/interest-form/types";

/**
 * The inquiry is an inquiry.
 *
 * Jimmy, 29 September 2026, on finding the GA GOAL section, its uploads, its
 * signature and its attestations on the public form: "this should only
 * allow/show/gather the initial inquiry information." Then: "there should not
 * be any scholarship information included anywhere on any school's inquiry
 * form." Then, twice: "these are the only fields that should ever show for the
 * inquiry/interest form for all schools at all times."
 *
 * These tests exist because that rule cannot live only in a migration. A
 * migration is a moment; a form builder is forever. Danni or Jimmy can publish
 * a new version tomorrow, and the thing that has to refuse a 22nd field on the
 * front door is here.
 */

const q = (
  key: string,
  extra: Partial<InterestQuestionDefinition> = {}
): InterestQuestionDefinition => ({
  key,
  type: "text",
  label: key,
  required: false,
  order: 0,
  ...extra,
});

const s = (
  key: string,
  questionKeys: string[],
  extra: Partial<InterestSectionDefinition> = {}
): InterestSectionDefinition => ({
  key,
  title: key,
  order: 0,
  questionKeys,
  ...extra,
});

function def(
  sections: InterestSectionDefinition[],
  questions: InterestQuestionDefinition[]
): InterestFormDefinition {
  return {
    schemaVersion: "interest_form.v1",
    title: "Admissions Inquiry",
    sections,
    questions,
  };
}

describe("interest form phases", () => {
  it("treats a definition that declares no phase as all-inquiry", () => {
    /*
     * v31 and every version before it. If this returned "application-only"
     * the deploy would serve an EMPTY inquiry to every family between the
     * code shipping and migration 454 running. The escape hatch is what lets
     * the mechanism ship ahead of the data.
     */
    const d = def([s("student", ["first_name"])], [q("first_name")]);
    expect(definitionDeclaresPhases(d)).toBe(false);
    expect(
      isQuestionInPhase({
        definition: d,
        question: d.questions[0],
        section: d.sections[0],
        phase: "inquiry",
      })
    ).toBe(true);
  });

  it("keeps an unmarked section OFF the inquiry once any phase is declared", () => {
    /*
     * Default-closed at the front door. A section somebody adds next month
     * and forgets to mark lands on the application, never on the page a
     * stranger sees.
     */
    const d = def(
      [
        s("student", ["first_name"], { phase: "inquiry" }),
        s("new_section", ["something_new"]),
      ],
      [q("first_name"), q("something_new")]
    );
    expect(definitionDeclaresPhases(d)).toBe(true);
    expect(
      isQuestionInPhase({
        definition: d,
        question: d.questions[1],
        section: d.sections[1],
        phase: "inquiry",
      })
    ).toBe(false);
  });

  it("lets a question override its section in both directions", () => {
    /*
     * Five questions sit in inquiry sections and belong to the application
     * (program_hs, program_virtual, virtual_program_interest,
     * peer_interaction, anything_else). One sits in an application section
     * and belongs to the inquiry: hs_student_email, Jimmy's deliberate
     * exception of 30 September.
     */
    const d = def(
      [
        s("program_school", ["program", "program_hs"], { phase: "inquiry" }),
        s("hs_detail", ["hs_student_email"], { phase: "application" }),
      ],
      [
        q("program"),
        q("program_hs", { phase: "application" }),
        q("hs_student_email", { phase: "inquiry" }),
      ]
    );
    const at = (i: number, sec: number) =>
      isQuestionInPhase({
        definition: d,
        question: d.questions[i],
        section: d.sections[sec],
        phase: "inquiry",
      });
    expect(at(0, 0)).toBe(true);
    expect(at(1, 0)).toBe(false);
    expect(at(2, 1)).toBe(true);
  });

  it("shows everything on the application", () => {
    const d = def(
      [s("ga_goal", ["ga_goal_signature"], { phase: "application" })],
      [q("ga_goal_signature")]
    );
    expect(
      isQuestionInPhase({
        definition: d,
        question: d.questions[0],
        section: d.sections[0],
        phase: "application",
      })
    ).toBe(true);
  });
});

describe("an inquiry submission is not judged against the application", () => {
  const d = def(
    [
      s("student", ["first_name"], { phase: "inquiry" }),
      s("ga_goal", ["ga_goal_income_document"], { phase: "application" }),
    ],
    [
      q("first_name", { required: true }),
      q("ga_goal_income_document", { required: true, type: "file" }),
    ]
  );

  const base = {
    definition: d,
    schoolIds: new Set<string>(),
    programCodesForSchool: new Set<string>(),
    claimedFormVersionId: "v",
    publishedFormVersionId: "v",
  };

  it("accepts the inquiry without the application's required questions", () => {
    /*
     * The failure this guards against takes the whole form down: filter the
     * questions in the renderer only, and the validator still demands the 44
     * it cannot see, so every inquiry is refused for fields nobody was shown.
     */
    const result = validateInterestSubmission({
      ...base,
      values: { first_name: "Jayden" },
      phase: "inquiry",
    });
    expect(result.ok).toBe(true);
  });

  it("refuses the application when its own required question is missing", () => {
    const result = validateInterestSubmission({
      ...base,
      values: { first_name: "Jayden" },
      phase: "application",
    });
    expect(result.ok).toBe(false);
  });

  it("does not store an application answer posted at the front door", () => {
    /*
     * Hidden on screen AND refused on submit. A question the inquiry does not
     * ask is a question the inquiry does not record, however the POST was
     * assembled.
     */
    const result = validateInterestSubmission({
      ...base,
      values: { first_name: "Jayden", ga_goal_income_document: "docs/sneaky.pdf" },
      phase: "inquiry",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(Object.keys(result.visibleValues)).toEqual(["first_name"]);
    }
  });
});
