/**
 * Canonical student/admissions program codes.
 * Must stay aligned with:
 * - public.students_program_check (053_phase1_sis_tables.sql)
 * - public.sis_enrollments program check
 * - public.admissions_leads program check
 * - public.org_programs seed codes (074_enterprise_identity_foundation.sql)
 *
 * StudentForm option `value`s MUST be exactly these codes — never marketing aliases.
 */
export const PROGRAMS = [
  {
    value: "academy_fl_campus",
    label: "The Academy FL – In-Person",
  },
  {
    value: "academy_fl_virtual",
    label: "The Academy FL – Virtual",
  },
  {
    value: "academy_ga_campus",
    label: "The Academy GA – In-Person",
  },
  {
    value: "academy_ga_hybrid",
    label: "The Academy GA – Hybrid",
  },
  {
    value: "academy_hs",
    label: "The Academy HS",
  },
  {
    value: "academy_virtual",
    label: "The Academy Virtual – Full School Program",
  },
] as const;

export type ProgramValue = (typeof PROGRAMS)[number]["value"];

/** Exact set enforced by students_program_check / related CHECK constraints. */
export const STUDENTS_PROGRAM_CODES: readonly ProgramValue[] = PROGRAMS.map((p) => p.value);

const PROGRAM_BY_VALUE = new Map(PROGRAMS.map((p) => [p.value, p]));

/**
 * Historical / marketing codes that may still exist in stored leads or cached clients.
 * Used ONLY for display and for reading legacy rows — never as StudentForm option values,
 * and never silently accepted on new student create writes.
 */
export const HISTORICAL_PROGRAM_ALIASES: Record<string, ProgramValue> = {
  academy_hs_experience: "academy_hs",
  academy_fl_in_person: "academy_fl_campus",
  academy_ga_in_person: "academy_ga_campus",
  academy_ga_virtual: "academy_ga_hybrid",
  academy_virtual_full_school: "academy_virtual",
  academy_virtual_tutoring: "academy_virtual",
};

/** @deprecated Use HISTORICAL_PROGRAM_ALIASES — kept for existing test imports. */
export const LEGACY_PROGRAM_ALIASES = HISTORICAL_PROGRAM_ALIASES;

export function isProgramValue(value: string): value is ProgramValue {
  return PROGRAM_BY_VALUE.has(value as ProgramValue);
}

/**
 * Resolve a stored or inbound program string to a canonical DB code.
 * Accepts canonical codes and historical aliases (for reading legacy rows).
 */
export function parseProgramValue(value: string | null | undefined): ProgramValue | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isProgramValue(trimmed)) return trimmed;
  return HISTORICAL_PROGRAM_ALIASES[trimmed] ?? null;
}

/**
 * Strict write-path guard for StudentForm / createStudent.
 * Only exact students_program_check codes are allowed — aliases are rejected
 * so invalid mappings cannot reach Postgres.
 */
export function assertCanonicalProgramForWrite(
  value: string | null | undefined
):
  | { ok: true; program: ProgramValue | null }
  | { ok: false; error: string } {
  if (value == null) return { ok: true, program: null };
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, program: null };

  if (isProgramValue(trimmed)) {
    return { ok: true, program: trimmed };
  }

  const historical = HISTORICAL_PROGRAM_ALIASES[trimmed];
  if (historical) {
    return {
      ok: false,
      error:
        `Invalid program "${trimmed}". That code is outdated; select "${programLabel(historical)}" ` +
        `(${historical}) from the Program list. ` +
        `Allowed values: ${STUDENTS_PROGRAM_CODES.join(", ")}.`,
    };
  }

  return {
    ok: false,
    error:
      `Invalid program "${trimmed}". Select a program from the list. ` +
      `Allowed values: ${STUDENTS_PROGRAM_CODES.join(", ")}.`,
  };
}

/** Audit row for every visible StudentForm program option. */
export type ProgramOptionAudit = {
  uiLabel: string;
  submittedValue: string;
  canonicalDbCode: ProgramValue;
  pass: boolean;
};

export function auditProgramOptions(): ProgramOptionAudit[] {
  return PROGRAMS.map((option) => {
    const gate = assertCanonicalProgramForWrite(option.value);
    const canonical = gate.ok ? gate.program : null;
    return {
      uiLabel: option.label,
      submittedValue: option.value,
      canonicalDbCode: (canonical ?? option.value) as ProgramValue,
      pass: gate.ok && canonical === option.value && isProgramValue(option.value),
    };
  });
}

export const FUNDING_SOURCE_CATEGORIES = [
  { value: "parent", label: "Parent" },
  { value: "scholarship", label: "Scholarship" },
  { value: "state_funding", label: "State Funding" },
  { value: "public_placement", label: "Public Placement" },
  { value: "government_program", label: "Government Program" },
  { value: "corporate", label: "Corporate" },
  { value: "other", label: "Other" },
] as const;

export type FundingSourceCategoryValue =
  (typeof FUNDING_SOURCE_CATEGORIES)[number]["value"];

export const FUNDING_SOURCES = [
  { value: "parent_pay", label: "Parent Pay", category: "parent" },
  { value: "family_scholarship", label: "Family Scholarship", category: "scholarship" },
  { value: "school_scholarship", label: "School Scholarship", category: "scholarship" },
  { value: "outside_scholarship", label: "Outside Scholarship", category: "scholarship" },
  { value: "esa", label: "ESA", category: "state_funding" },
  { value: "step_up_for_students", label: "Step Up For Students", category: "state_funding" },
  { value: "mckay_scholarship", label: "McKay Scholarship", category: "state_funding" },
  { value: "fes_ua", label: "FES-UA", category: "state_funding" },
  { value: "district_placement", label: "District Placement", category: "public_placement" },
  {
    value: "vocational_rehabilitation",
    label: "Vocational Rehabilitation",
    category: "government_program",
  },
  { value: "medicaid_waiver", label: "Medicaid Waiver", category: "government_program" },
  {
    value: "state_agency_placement",
    label: "State Agency Placement",
    category: "government_program",
  },
  { value: "grant_funded", label: "Grant Funded", category: "scholarship" },
  { value: "corporate_sponsorship", label: "Corporate Sponsorship", category: "corporate" },
  { value: "other", label: "Other", category: "other" },
] as const;

export type FundingSourceValue = (typeof FUNDING_SOURCES)[number]["value"];

const FUNDING_BY_VALUE = new Map(FUNDING_SOURCES.map((f) => [f.value, f]));

/** Maps legacy single-select funding_source column values to normalized codes. */
export const LEGACY_FUNDING_SOURCE_MAP: Record<string, FundingSourceValue> = {
  private_pay: "parent_pay",
  esa: "esa",
  voucher: "step_up_for_students",
  tax_credit_scholarship: "family_scholarship",
  school_scholarship: "school_scholarship",
};

export function programLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const canonical = parseProgramValue(value) ?? value;
  return PROGRAM_BY_VALUE.get(canonical as ProgramValue)?.label ?? value;
}

export function fundingSourceLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const mapped = LEGACY_FUNDING_SOURCE_MAP[value] ?? value;
  return FUNDING_BY_VALUE.get(mapped as FundingSourceValue)?.label ?? value;
}

export function fundingSourceCategory(
  value: string | null | undefined
): FundingSourceCategoryValue | null {
  if (!value) return null;
  const mapped = LEGACY_FUNDING_SOURCE_MAP[value] ?? value;
  return FUNDING_BY_VALUE.get(mapped as FundingSourceValue)?.category ?? null;
}

export function fundingSourceCategoryLabel(value: string | null | undefined): string {
  if (!value) return "—";
  if (value === "unassigned") return "Unassigned";
  return (
    FUNDING_SOURCE_CATEGORIES.find((c) => c.value === value)?.label ?? value
  );
}

export function fundingSourceLabels(values: string[] | null | undefined): string[] {
  if (!values?.length) return [];
  return values.map((v) => fundingSourceLabel(v));
}
