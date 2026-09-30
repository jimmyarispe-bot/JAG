/**
 * Admissions Interest Form — Phase 1 types (versioned definition + answers).
 */

import type { FormConditionGroup } from "@/lib/platform/forms/types";

export const INTEREST_FORM_SCHEMA_VERSION = "interest_form.v1" as const;

export type InterestFieldType =
  | "text"
  | "rich_text"
  | "email"
  | "phone"
  | "date"
  | "number"
  /** A number shown and validated as money. Stored as a plain number. */
  | "currency"
  | "select"
  | "multiselect"
  | "boolean"
  | "school_selector"
  | "program_selector"
  | "consent"
  /**
   * A typed-name signature against a statement.
   *
   * The statement is the question's label; the answer is the name the person
   * types. The date is not a separate field — the submission already carries
   * `submitted_at`, and a second date a parent can edit is a date that can
   * disagree with the record.
   */
  | "signature"
  /**
   * A document. The stored answer is the storage path returned by
   * /api/apply/upload, never the file itself and never a name the browser chose.
   */
  | "file";

/**
 * Which of the two moments a section or a question belongs to.
 *
 * Jimmy, 29 September 2026, on finding the GA GOAL scholarship section on the
 * public form: "this should only allow/show/gather the initial inquiry
 * information." And then the rule: "there should not be any scholarship
 * information included anywhere on any school's inquiry form."
 *
 * ONE definition, two doors. /apply renders the inquiry-phase questions only.
 * /apply/start/<token> - the link a school leader sends - renders everything.
 * Two separate definitions would drift; this cannot.
 *
 * DEFAULT-CLOSED AT THE FRONT DOOR. A section or question that declares no
 * phase is application-only. A question added in the form builder next month
 * and left unmarked lands on the application, never on the inquiry, so the
 * failure mode points away from the family we have not met yet.
 *
 * The one exception is a definition where NOTHING declares a phase - every
 * version up to and including v31. Those are treated as all-inquiry, which is
 * exactly how they behave today, so this type can ship before v32 publishes
 * and nothing changes for a family mid-form. See definitionDeclaresPhases().
 */
/**
 * "inquiry_only" is the third case, added 30 September after Jimmy walked the
 * application: `program` (In-Person / Only Virtual / Hybrid) appeared there
 * alongside `program_virtual`, both labelled "Program(s) of Interest", one of
 * them offering a single option. "we need to delete the first program of
 * interest option... it's redundant based on the next question."
 *
 * It cannot simply be an application question - it is one of the 20 the
 * inquiry must ask at every campus. So it is asked at the front door and NOT
 * repeated behind the token.
 */
export type InterestFormPhase = "inquiry" | "application" | "inquiry_only";

export type InterestOptionSource = "grades" | "funding_sources" | "programs" | "schools";

export type InterestQuestionOption = {
  readonly value: string;
  readonly label: string;
  /**
   * When this CHOICE may be offered, as distinct from when the question is.
   *
   * Jimmy, 27 September 2026: a Georgia resident taking Virtual or HS classes
   * may use their GA Special Needs scholarship, but cannot apply for GA GOAL
   * or Academy-Based - "those options should not be available to them".
   *
   * Section and question visibility could not express that: the question is
   * the same question and the family must still see it. The only two ways to
   * do it without option-level rules were to ask a second, near-identical
   * question with a shorter list, or to offer all four and refuse on submit.
   * Both leave a parent looking at something they cannot have, and the second
   * teaches them that the form's choices are not to be trusted.
   *
   * Absent means always offered, which is what every option in every form is
   * today.
   */
  readonly visibleWhen?: FormConditionGroup | null;
};

export type InterestQuestionDefinition = {
  readonly key: string;
  readonly type: InterestFieldType;
  readonly label: string;
  readonly required: boolean;
  readonly order: number;
  readonly systemBinding?: string | null;
  readonly options?: readonly InterestQuestionOption[];
  readonly optionSource?: InterestOptionSource;
  readonly placeholder?: string;
  readonly defaultValue?: unknown;
  readonly visibleWhen?: FormConditionGroup | null;
  readonly helpText?: string;
  /**
   * Overrides the section's phase, in BOTH directions.
   *
   * Five questions sit inside inquiry sections and belong to the
   * application: program_hs, program_virtual, virtual_program_interest,
   * peer_interaction, anything_else. One sits inside an application
   * section and belongs to the inquiry: hs_student_email, which Jimmy
   * kept on the front door on 30 September as a deliberate exception -
   * HS families are asked for the student's address, nobody else is.
   *
   * Absent means inherit the section.
   */
  readonly phase?: InterestFormPhase | null;
};

export type InterestSectionDefinition = {
  readonly key: string;
  readonly title: string;
  readonly description?: string;
  readonly order: number;
  readonly questionKeys: readonly string[];
  readonly visibleWhen?: FormConditionGroup | null;
  /** Absent means application-only. See InterestFormPhase. */
  readonly phase?: InterestFormPhase | null;
};

export type InterestFormDefinition = {
  readonly schemaVersion: typeof INTEREST_FORM_SCHEMA_VERSION | string;
  readonly title: string;
  readonly sections: readonly InterestSectionDefinition[];
  readonly questions: readonly InterestQuestionDefinition[];
};

export type InterestFormValues = Record<string, unknown>;

export type PublishedInterestForm = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly formId: string;
  readonly formVersionId: string;
  readonly versionNumber: number;
  readonly definition: InterestFormDefinition;
  readonly schools: readonly { id: string; name: string }[];
};

export type InterestProgramOption = {
  readonly code: string;
  readonly name: string;
};
