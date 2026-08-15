/**
 * Public Interest Form program TYPES — not the CRM/org_programs catalog.
 *
 * Canonical DB programs remain school-specific (academy_fl_campus, etc.).
 * These five values are public inquiry types only. They are not mapped onto
 * org_programs or admissions_leads.program.
 */

export const INTEREST_FORM_PROGRAM_QUESTION_LABEL = "Program(s) of Interest";
export const INTEREST_FORM_PROGRAM_QUESTION_HELP = "Select all that apply";

export type InterestFormProgramOption = {
  readonly value: string;
  readonly label: string;
};

export const INTEREST_FORM_PROGRAM_OPTIONS = [
  { value: "In-Person", label: "In-Person" },
  { value: "Only Virtual", label: "Only Virtual" },
  { value: "Hybrid (in-person + virtual)", label: "Hybrid (in-person + virtual)" },
  { value: "Full-School Program", label: "Full-School Program" },
  { value: "Tutoring", label: "Tutoring" },
] as const satisfies readonly InterestFormProgramOption[];

export type InterestFormProgramValue =
  (typeof INTEREST_FORM_PROGRAM_OPTIONS)[number]["value"];

const PROGRAM_TYPE_VALUES = new Set<string>(
  INTEREST_FORM_PROGRAM_OPTIONS.map((option) => option.value)
);

export function isInterestFormProgramValue(
  value: string
): value is InterestFormProgramValue {
  return PROGRAM_TYPE_VALUES.has(value);
}

export function allowedInterestProgramTypes(): Set<string> {
  return new Set(PROGRAM_TYPE_VALUES);
}

/** Unique program-type values from FormData / validation input. */
export function normalizeInterestProgramSelections(raw: unknown): string[] {
  const values = Array.isArray(raw)
    ? raw.map(String)
    : raw == null || raw === ""
      ? []
      : [String(raw)];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    unique.push(trimmed);
  }
  return unique;
}
