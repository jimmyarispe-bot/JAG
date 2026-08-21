import { parseProgramValue } from "@/lib/constants/programs";
import type {
  ImportDestination,
  ImportLookupContext,
  ValidationIssue,
} from "../../types";
import { normalizeGrade } from "../student/validate";
import { resolveLeadStatus } from "./stage-mapping";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Academy labels from the legacy export → canonical program codes.
 * Campus detail (Port St. Lucie vs Vero Beach) is preserved in notes at commit —
 * `admissions_leads` has no campus column.
 */
const ACADEMY_LABEL_TO_PROGRAM: Record<string, string> = {
  "the academy virtual - full-school program": "academy_virtual",
  "the academy virtual - tutoring": "academy_virtual",
  "the academy virtual": "academy_virtual",
  "the academy fl @ port st. lucie": "academy_fl_campus",
  "the academy fl @ vero beach": "academy_fl_campus",
  "the academy ga": "academy_ga_campus",
  "the academy hs": "academy_hs",
};

export function normalizeProgram(value: string | null | undefined): string | null {
  if (!value) return null;
  const canonical = parseProgramValue(value);
  if (canonical) return canonical;
  return ACADEMY_LABEL_TO_PROGRAM[value.trim().toLowerCase()] ?? null;
}

export function validateLeadRow(
  mapped: Record<string, unknown>,
  _ctx: ImportLookupContext,
  _destination: ImportDestination,
  rowNumber: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const str = (key: string) => {
    const v = mapped[key];
    return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  };

  if (!str("first_name")) {
    issues.push({
      severity: "error",
      code: "lead_first_name_required",
      message: "Student first name is required",
      fieldName: "first_name",
      rowNumber,
    });
  }
  if (!str("last_name")) {
    issues.push({
      severity: "error",
      code: "lead_last_name_required",
      message: "Student last name is required",
      fieldName: "last_name",
      rowNumber,
    });
  }

  const status = str("lead_status");
  if (!status) {
    issues.push({
      severity: "error",
      code: "lead_status_required",
      message: "Status is required to place the lead on the pipeline",
      fieldName: "lead_status",
      rowNumber,
      resolutionHint: "Set a status, or import this row manually.",
    });
  } else {
    const resolved = resolveLeadStatus(status);
    if (!resolved) {
      issues.push({
        severity: "error",
        code: "lead_status_unrecognized",
        message: `Status "${status}" is not a known admissions status`,
        fieldName: "lead_status",
        rowNumber,
        resolutionHint:
          "Add it to LEAD_STATUS_MAP, or correct the value in the source file.",
      });
    } else if (resolved.isStudentRecord) {
      issues.push({
        severity: "warning",
        code: "lead_status_is_roster_record",
        message: `"${status}" belongs in the student roster, not the admissions pipeline`,
        fieldName: "lead_status",
        rowNumber,
        resolutionHint: "Import this row with the Students importer instead.",
      });
    }
  }

  const email = str("guardian_email");
  if (email && !EMAIL_RE.test(email)) {
    issues.push({
      severity: "warning",
      code: "lead_guardian_email_invalid",
      message: `Parent email "${email}" does not look valid`,
      fieldName: "guardian_email",
      rowNumber,
    });
  }
  if (!email && !str("guardian_phone")) {
    issues.push({
      severity: "warning",
      code: "lead_no_contact_method",
      message: "No parent email or phone — this lead cannot be contacted",
      rowNumber,
    });
  }

  const grade = str("current_grade");
  if (grade && !normalizeGrade(grade)) {
    issues.push({
      severity: "warning",
      code: "lead_grade_unrecognized",
      message: `Grade "${grade}" was not recognized and will be left blank`,
      fieldName: "current_grade",
      rowNumber,
    });
  }

  const program = str("program");
  if (program && !normalizeProgram(program)) {
    issues.push({
      severity: "warning",
      code: "lead_program_unrecognized",
      message: `Academy "${program}" did not map to a program and will be left blank`,
      fieldName: "program",
      rowNumber,
      resolutionHint: "The original value is preserved in the lead's notes.",
    });
  }

  return issues;
}
