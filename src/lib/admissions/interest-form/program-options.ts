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

/**
 * THE NETWORK'S PROGRAM TYPES ARE NOT ONE LIST, AND NEVER WERE.
 *
 * Jimmy, 28 September 2026: "take out full school and tutoring options in ga
 * and fl forms. this is only for the academy virtual" - and then, for the high
 * school, six of its own.
 *
 * Until today every campus was offered the same five, so a Georgia family was
 * invited to ask for Tutoring that Georgia does not run, and a high school
 * family was never shown the six things the high school actually offers. This
 * constant is now the union of every campus's list, and which campus sees
 * which option is decided by the option's own `visibleWhen` rule in the
 * published form definition.
 *
 * NOTHING IS REMOVED FROM THIS LIST. The five original values are recorded on
 * leads going back to September; deleting one would make an existing answer
 * unreadable. Hiding an option from a campus is a visibility rule, not a
 * deletion - see CAMPUS_PROGRAM_OPTIONS below.
 */
export const INTEREST_FORM_PROGRAM_OPTIONS = [
  { value: "In-Person", label: "In-Person" },
  { value: "Only Virtual", label: "Only Virtual" },
  { value: "Hybrid (in-person + virtual)", label: "Hybrid (in-person + virtual)" },
  { value: "Full-School Program", label: "Full-School Program" },
  { value: "Tutoring", label: "Tutoring" },
  // The Academy HS, added 28 September 2026.
  { value: "Full High School Experience", label: "Full High School Experience" },
  { value: "Tutoring - HS Life Lab", label: "Tutoring - HS Life Lab" },
  { value: "Tutoring - HS Earth Quest", label: "Tutoring - HS Earth Quest" },
  { value: "Tutoring - HS Real-World Math", label: "Tutoring - HS Real-World Math" },
  { value: "Tutoring - HS Entrepreneurship", label: "Tutoring - HS Entrepreneurship" },
  { value: "Structured Literacy", label: "Structured Literacy" },
] as const satisfies readonly InterestFormProgramOption[];

/**
 * What a BRAND NEW form starts with, and why it is not the union above.
 *
 * A seeded form has no campus rules on it, because the rules name school ids
 * and a school id does not exist until an organization has schools. So the
 * seed offers the five the network has always offered, and a migration adds a
 * campus's own list once that campus exists.
 *
 * Seeding the union instead would hand every new organization all eleven with
 * no rules attached - including the high school's six, to campuses that are
 * not a high school. The test that caught this asserts the seed exposes five,
 * and it was right to.
 */
export const SEED_PROGRAM_OPTIONS: readonly InterestFormProgramOption[] = [
  { value: "In-Person", label: "In-Person" },
  { value: "Only Virtual", label: "Only Virtual" },
  { value: "Hybrid (in-person + virtual)", label: "Hybrid (in-person + virtual)" },
  { value: "Full-School Program", label: "Full-School Program" },
  { value: "Tutoring", label: "Tutoring" },
];

/**
 * Which campus offers which, by the campus's name in `public.schools`.
 *
 * This is the source the migration builds the form's visibility rules from.
 * It is keyed on the school NAME because that is what a person can check
 * against reality; the migration turns each name into that school's id, and
 * fails loudly rather than quietly skipping a campus it cannot find.
 *
 * A campus absent from this map offers the network default - the first three.
 *
 * HOW THE LIVE FORM IMPLEMENTS THIS, as of migration 451: not one question
 * with per-option rules, but three program questions already gated by campus
 * - `program` (shown when the school is neither HS nor Virtual), `program_hs`
 * and `program_virtual`. Each now declares its campus's list outright, which
 * is simpler than option-level rules and was the structure already there.
 * This map is what 451 was built from and what a later campus change should
 * be checked against.
 */
export const CAMPUS_PROGRAM_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  "the academy fl": ["In-Person", "Only Virtual", "Hybrid (in-person + virtual)"],
  "the academy ga": ["In-Person", "Only Virtual", "Hybrid (in-person + virtual)"],
  // Two, not five. Written as five on 28 September from the network default,
  // before the live form was read - and the live form turned out to give
  // Virtual its own question offering a single choice. Jimmy, 29 September,
  // chose these two and dropped "Only Virtual": at a virtual school it said
  // nothing. In-Person and Hybrid were never Virtual's to offer.
  "the academy virtual": ["Full-School Program", "Tutoring"],
  "the academy hs": [
    "Full High School Experience",
    "Tutoring - HS Life Lab",
    "Tutoring - HS Earth Quest",
    "Tutoring - HS Real-World Math",
    "Tutoring - HS Entrepreneurship",
    "Structured Literacy",
  ],
};

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
