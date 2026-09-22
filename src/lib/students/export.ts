/**
 * Exporting pupil records.
 *
 * WHAT THIS IS FOR. State reporting, enrolment paperwork and contact sheets.
 * It carries children's dates of birth, ethnicity and their parents' contact
 * details, which makes it the most sensitive thing the platform hands to
 * anybody.
 *
 * HOW ACCESS IS DECIDED. It isn't - not here. The export reads through
 * getStudents(), which reads through the caller's own Supabase client, so RLS
 * decides what comes back exactly as it does for the list on screen. A school
 * leader exports their campus because that is what they can see. There is no
 * second access rule in this file to fall out of step with the first one.
 *
 * That is deliberate. The failure this avoids is the one that cost a week
 * earlier this month: pay was computed inside the teacher's own permissions and
 * silently returned less. An export with its own rules can silently return MORE.
 *
 * BLANKS STAY BLANK. A missing date of birth is written as an empty cell, not
 * as "not recorded" or "N/A". Anything else corrupts the file for every system
 * that might read it, and invents a value the record does not hold. What the
 * operator needs instead is to know BEFORE exporting how many rows will be
 * empty - which is what fieldCoverage() below is for.
 */

import type { StudentRecord } from "@/lib/students/queries";

export type ExportFieldGroup =
  | "Student"
  | "Enrolment"
  | "Ethnicity"
  | "Family & address"
  | "Parents & guardians"
  | "Funding"
  | "Identifiers";

export interface ExportField {
  /** Stable key used by the picker and the URL. Never shown to a person. */
  readonly key: string;
  /** Column heading in the file. */
  readonly label: string;
  readonly group: ExportFieldGroup;
  /** Pull the value. Returns null when the record does not hold one. */
  readonly get: (row: ExportRow) => string | null;
}

/** A student plus the related rows the export needs. */
export interface ExportRow {
  readonly student: StudentRecord & Record<string, unknown>;
  readonly guardians: readonly Record<string, unknown>[];
  readonly family: Record<string, unknown> | null;
}

/* ------------------------------------------------------------------ helpers */

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/** ISO date, trimmed of any time part. Dates must not become numbers in Excel. */
function isoDate(value: unknown): string | null {
  const s = text(value);
  if (!s) return null;
  return s.slice(0, 10);
}

function yesNo(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return value === true ? "Yes" : value === false ? "No" : null;
}

function list(value: unknown): string | null {
  if (!Array.isArray(value)) return text(value);
  const items = value.map((v) => String(v).trim()).filter(Boolean);
  return items.length ? items.join("; ") : null;
}

function nested(row: Record<string, unknown>, key: string, field: string): string | null {
  const child = row[key];
  if (!child || typeof child !== "object") return null;
  return text((child as Record<string, unknown>)[field]);
}

/**
 * Guardians in the order a person would want them: the primary contact first,
 * then anyone else, so guardian_1 is not whichever row the database happened to
 * return first.
 */
function orderedGuardians(row: ExportRow): readonly Record<string, unknown>[] {
  return [...row.guardians].sort((a, b) => {
    const ap = a.is_primary === true ? 0 : 1;
    const bp = b.is_primary === true ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return String(a.last_name ?? "").localeCompare(String(b.last_name ?? ""));
  });
}

function guardian(row: ExportRow, index: number): Record<string, unknown> | null {
  return orderedGuardians(row)[index] ?? null;
}

function guardianName(g: Record<string, unknown> | null): string | null {
  if (!g) return null;
  const name = `${String(g.first_name ?? "")} ${String(g.last_name ?? "")}`.trim();
  return name.length ? name : null;
}

/* ------------------------------------------------------------- the catalogue */

function guardianFields(index: number): ExportField[] {
  const n = index + 1;
  const g = (row: ExportRow) => guardian(row, index);
  return [
    {
      key: `guardian_${n}_name`,
      label: `Parent/guardian ${n} name`,
      group: "Parents & guardians",
      get: (row) => guardianName(g(row)),
    },
    {
      key: `guardian_${n}_relationship`,
      label: `Parent/guardian ${n} relationship`,
      group: "Parents & guardians",
      get: (row) => text(g(row)?.relationship_to_student),
    },
    {
      key: `guardian_${n}_email`,
      label: `Parent/guardian ${n} email`,
      group: "Parents & guardians",
      get: (row) => text(g(row)?.email),
    },
    {
      key: `guardian_${n}_phone`,
      label: `Parent/guardian ${n} phone`,
      group: "Parents & guardians",
      get: (row) => text(g(row)?.phone),
    },
  ];
}

export const EXPORT_FIELDS: readonly ExportField[] = [
  /* Student */
  { key: "last_name", label: "Last name", group: "Student", get: (r) => text(r.student.last_name) },
  { key: "first_name", label: "First name", group: "Student", get: (r) => text(r.student.first_name) },
  { key: "preferred_name", label: "Preferred name", group: "Student", get: (r) => text(r.student.preferred_name) },
  { key: "legal_middle_name", label: "Middle name", group: "Student", get: (r) => text(r.student.legal_middle_name) },
  { key: "date_of_birth", label: "Date of birth", group: "Student", get: (r) => isoDate(r.student.date_of_birth) },
  { key: "gender", label: "Gender", group: "Student", get: (r) => text(r.student.gender) },
  { key: "grade_level", label: "Grade", group: "Student", get: (r) => text(r.student.grade_level) },
  { key: "school", label: "Campus", group: "Student", get: (r) => nested(r.student, "schools", "name") },
  { key: "campus", label: "Site", group: "Student", get: (r) => nested(r.student, "campuses", "name") },
  { key: "program", label: "Program", group: "Student", get: (r) => text(r.student.program) },
  { key: "school_email", label: "School email", group: "Student", get: (r) => text(r.student.school_email) },

  /* Enrolment */
  { key: "status", label: "Status", group: "Enrolment", get: (r) => text(r.student.status) },
  { key: "enrollment_status", label: "Enrolment status", group: "Enrolment", get: (r) => text(r.student.enrollment_status) },
  { key: "lifecycle_stage", label: "Lifecycle stage", group: "Enrolment", get: (r) => text(r.student.lifecycle_stage) },
  { key: "enrollment_start_date", label: "Enrolment start", group: "Enrolment", get: (r) => isoDate(r.student.enrollment_start_date) },
  { key: "enrollment_exit_date", label: "Enrolment exit", group: "Enrolment", get: (r) => isoDate(r.student.enrollment_exit_date) },
  { key: "graduation_year", label: "Graduation year", group: "Enrolment", get: (r) => text(r.student.graduation_year) },
  { key: "created_at", label: "Record created", group: "Enrolment", get: (r) => isoDate(r.student.created_at) },
  { key: "archived_at", label: "Archived", group: "Enrolment", get: (r) => isoDate(r.student.archived_at) },

  /*
   * Ethnicity. Added by migration 407 in the federal two-part shape that FL and
   * GA reporting requires: a yes/no on Hispanic or Latino, then one or more
   * races. If 407 has not been applied these read as blank rather than throwing,
   * which is why every accessor goes through text()/yesNo() rather than
   * touching the value directly.
   */
  { key: "hispanic_or_latino", label: "Hispanic or Latino", group: "Ethnicity", get: (r) => yesNo(r.student.hispanic_or_latino) },
  { key: "race", label: "Race", group: "Ethnicity", get: (r) => list(r.student.race) },

  /* Family & address */
  { key: "family_name", label: "Family", group: "Family & address", get: (r) => nested(r.student, "families", "family_name") },
  { key: "primary_address", label: "Address", group: "Family & address", get: (r) => text(r.family?.primary_address) },
  { key: "city", label: "City", group: "Family & address", get: (r) => text(r.family?.city) },
  { key: "state", label: "State", group: "Family & address", get: (r) => text(r.family?.state) },
  { key: "zip_code", label: "ZIP", group: "Family & address", get: (r) => text(r.family?.zip_code) },
  { key: "billing_email", label: "Billing email", group: "Family & address", get: (r) => text(r.family?.billing_email) },
  { key: "billing_phone", label: "Billing phone", group: "Family & address", get: (r) => text(r.family?.billing_phone) },
  { key: "preferred_language", label: "Preferred language", group: "Family & address", get: (r) => text(r.family?.preferred_language) },

  /* Parents & guardians */
  ...guardianFields(0),
  ...guardianFields(1),

  /* Funding */
  { key: "funding_sources", label: "Funding sources", group: "Funding", get: (r) => list(r.student.funding_sources) },

  /* Identifiers */
  { key: "student_number", label: "Student number", group: "Identifiers", get: (r) => text(r.student.student_number) },
  { key: "state_student_ids", label: "State student IDs", group: "Identifiers", get: (r) => {
      const v = r.student.state_student_ids;
      if (!v || typeof v !== "object") return text(v);
      const entries = Object.entries(v as Record<string, unknown>)
        .filter(([, val]) => text(val))
        .map(([k, val]) => `${k}=${String(val)}`);
      return entries.length ? entries.join("; ") : null;
    } },
  { key: "id", label: "Record ID", group: "Identifiers", get: (r) => text(r.student.id) },
];

export const EXPORT_FIELD_GROUPS: readonly ExportFieldGroup[] = [
  "Student",
  "Enrolment",
  "Ethnicity",
  "Family & address",
  "Parents & guardians",
  "Funding",
  "Identifiers",
];

/**
 * Ready-made selections. "Everything" is not a preset on purpose - selecting
 * every field should be a deliberate act, because it is the widest spread of a
 * child's personal data the platform can produce.
 */
export const EXPORT_PRESETS: Record<string, { label: string; hint: string; keys: readonly string[] }> = {
  state_reporting: {
    label: "State reporting",
    hint: "What FL and GA forms ask for",
    keys: [
      "last_name", "first_name", "legal_middle_name", "date_of_birth", "gender",
      "grade_level", "school", "hispanic_or_latino", "race",
      "enrollment_start_date", "enrollment_exit_date",
      "primary_address", "city", "state", "zip_code",
      "student_number", "state_student_ids",
    ],
  },
  contact_sheet: {
    label: "Contact sheet",
    hint: "Who to call, and about whom",
    keys: [
      "last_name", "first_name", "preferred_name", "grade_level", "school",
      "guardian_1_name", "guardian_1_relationship", "guardian_1_email", "guardian_1_phone",
      "guardian_2_name", "guardian_2_relationship", "guardian_2_email", "guardian_2_phone",
      "billing_email", "billing_phone", "preferred_language",
    ],
  },
  class_list: {
    label: "Class list",
    hint: "Names, grades and campuses",
    keys: ["last_name", "first_name", "preferred_name", "grade_level", "school", "program", "status"],
  },
};

/* --------------------------------------------------------------------- CSV */

/**
 * One CSV cell.
 *
 * Two hazards, both of which have bitten real schools:
 *
 * 1. A value beginning =, +, - or @ is treated by Excel and Sheets as a
 *    FORMULA. A surname such as "-Smith", or any value a parent typed into a
 *    form, can execute on open. Prefixing a single quote defuses it, and the
 *    quote is not shown in the cell.
 * 2. A leading zero matters. ZIP 02134 and phone 0117... lose their zero when
 *    the cell is read as a number. Quoting alone does not stop that in Excel,
 *    but it is what CSV permits; anyone importing elsewhere gets the real text.
 */
function csvCell(value: string | null): string {
  if (value === null) return "";
  const dangerous = /^[=+\-@\t\r]/.test(value);
  const safe = dangerous ? `'${value}` : value;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

/** Build the file. Fields come out in catalogue order, not click order. */
export function buildCsv(rows: readonly ExportRow[], selectedKeys: readonly string[]): string {
  const chosen = EXPORT_FIELDS.filter((f) => selectedKeys.includes(f.key));
  const fields = chosen.length ? chosen : EXPORT_FIELDS;

  const header = fields.map((f) => csvCell(f.label)).join(",");
  const body = rows.map((row) => fields.map((f) => csvCell(f.get(row))).join(","));

  /*
   * A BOM, so Excel on Windows reads it as UTF-8. Without it a name containing
   * an accent arrives mangled, and a family's name is not a detail worth
   * getting wrong.
   */
  return "﻿" + [header, ...body].join("\r\n") + "\r\n";
}

/**
 * How many of these rows actually hold a value for each field.
 *
 * Shown in the picker so nobody exports a column that is 6% populated without
 * knowing it. `enrollment_start_date` was 6 of 107 on 22 Sep 2026.
 */
export function fieldCoverage(rows: readonly ExportRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const field of EXPORT_FIELDS) {
    let n = 0;
    for (const row of rows) if (field.get(row) !== null) n += 1;
    out[field.key] = n;
  }
  return out;
}

/** students_FL_active_2026-09-22.csv — scope is in the name, not a header row. */
export function exportFileName(campus: string | null, statusFilter: string, today: Date): string {
  const slug = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  const parts = ["students"];
  if (campus) parts.push(slug(campus));
  parts.push(slug(statusFilter));
  parts.push(today.toISOString().slice(0, 10));
  return parts.join("_") + ".csv";
}
