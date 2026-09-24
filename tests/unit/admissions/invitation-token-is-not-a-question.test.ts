import { describe, expect, it } from "vitest";
import {
  INTEREST_FORM_METADATA_KEYS,
  isInterestFormMetadataKey,
  validateInterestSubmission,
} from "@/lib/admissions/interest-form/definition";
import type {
  InterestFormDefinition,
  InterestFormValues,
} from "@/lib/admissions/interest-form/types";

/**
 * "UNKNOWN QUESTION: INVITATION_TOKEN" — 24 September 2026.
 *
 * Lisa Roy opened her invitation link, filled in Jayden's entire application,
 * signed it, pressed submit and was told:
 *
 *     Unable to submit
 *     Unknown question: invitation_token. Please try again.
 *
 * She had done nothing wrong and there was nothing she could do. The renderer
 * posts the invitation token in the same body as the answers - that is how the
 * server knows whose application it is - and `formDataToInterestValues` sweeps
 * every field in that body into `values`. INTEREST_FORM_METADATA_KEYS is the
 * only thing separating a form field from a question, and the token was not on
 * it, so the validator reported the family's own credential as a question they
 * had invented.
 *
 * The invited route is the ONLY route that carries a token, so nothing on the
 * public form would ever have caught this. These tests stand in for the parent
 * who did.
 */

const VERSION = "00000000-0000-4000-8000-000000000001";

/**
 * The smallest definition the validator will accept: one section that claims
 * one question. `questionKeys` is not decoration - validateInterestSubmission
 * finds a question's section through it, so a section that does not list its
 * questions throws rather than validating.
 */
const DEFINITION: InterestFormDefinition = {
  schemaVersion: "1",
  title: "Application",
  sections: [
    { key: "student", title: "Student", order: 1, questionKeys: ["first_name"] },
  ],
  questions: [
    { key: "first_name", type: "text", label: "First Name", required: false, order: 1 },
  ],
};

function validate(values: InterestFormValues) {
  return validateInterestSubmission({
    definition: DEFINITION,
    values,
    schoolIds: new Set<string>(),
    programCodesForSchool: new Set<string>(),
    claimedFormVersionId: null,
    publishedFormVersionId: VERSION,
  });
}

function unknownQuestionIssues(values: InterestFormValues): string[] {
  const result = validate(values);
  if (result.ok) return [];
  return result.issues
    .filter((issue) => issue.message.startsWith("Unknown question"))
    .map((issue) => issue.message);
}

function storedAnswerKeys(values: InterestFormValues): string[] {
  const result = validate(values);
  return result.ok ? Object.keys(result.visibleValues) : [];
}

const TOKEN = "a".repeat(64);

describe("the invitation token is metadata, not a question", () => {
  it("is on the metadata list", () => {
    expect(INTEREST_FORM_METADATA_KEYS).toContain("invitation_token");
    expect(isInterestFormMetadataKey("invitation_token")).toBe(true);
  });

  it("does not report the family's own link as an unknown question", () => {
    expect(unknownQuestionIssues({ first_name: "Jayden", invitation_token: TOKEN })).toEqual([]);
  });

  it("never lands in the answers that get stored", () => {
    expect(storedAnswerKeys({ first_name: "Jayden", invitation_token: TOKEN })).not.toContain(
      "invitation_token"
    );
  });

  /*
   * The guard is a list, not a rule, so a field nobody put on it is still
   * refused. That behaviour is worth keeping - it is what would catch a
   * renamed question - and this asserts the list did not quietly become a
   * pass-through for everything.
   */
  it("still refuses a field that really is unknown", () => {
    const issues = unknownQuestionIssues({ first_name: "Jayden", favourite_colour: "blue" });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("favourite_colour");
  });
});
