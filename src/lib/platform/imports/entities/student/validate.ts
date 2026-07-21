import { GRADES, type GradeValue } from "@/lib/constants/grades";
import { parseProgramValue } from "@/lib/constants/programs";
import type {
  ImportDestination,
  ImportLookupContext,
  ValidationIssue,
} from "../../types";
import { scholarshipValidationIssue } from "./scholarship-intelligence";

const GRADE_ALIASES: Record<string, GradeValue> = {
  k: "kindergarten",
  kinder: "kindergarten",
  kindergarten: "kindergarten",
  "0": "kindergarten",
  "1": "1st_grade",
  "1st": "1st_grade",
  "1st grade": "1st_grade",
  "2": "2nd_grade",
  "2nd": "2nd_grade",
  "2nd grade": "2nd_grade",
  "3": "3rd_grade",
  "3rd": "3rd_grade",
  "3rd grade": "3rd_grade",
  "4": "4th_grade",
  "4th": "4th_grade",
  "4th grade": "4th_grade",
  "5": "5th_grade",
  "5th": "5th_grade",
  "5th grade": "5th_grade",
  "6": "6th_grade",
  "6th": "6th_grade",
  "6th grade": "6th_grade",
  "7": "7th_grade",
  "7th": "7th_grade",
  "7th grade": "7th_grade",
  "8": "8th_grade",
  "8th": "8th_grade",
  "8th grade": "8th_grade",
  "9": "9th_grade",
  "9th": "9th_grade",
  "9th grade": "9th_grade",
  "10": "10th_grade",
  "10th": "10th_grade",
  "10th grade": "10th_grade",
  "11": "11th_grade",
  "11th": "11th_grade",
  "11th grade": "11th_grade",
  "12": "12th_grade",
  "12th": "12th_grade",
  "12th grade": "12th_grade",
};

export function normalizeGrade(value: string | null | undefined): GradeValue | null {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  if (GRADES.some((g) => g.value === trimmed)) return trimmed as GradeValue;
  const byLabel = GRADES.find((g) => g.label.toLowerCase() === trimmed);
  if (byLabel) return byLabel.value;
  return GRADE_ALIASES[trimmed] ?? null;
}

export function validateStudentRow(
  mapped: Record<string, unknown>,
  ctx: ImportLookupContext,
  destination: ImportDestination,
  rowNumber: number
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!destination.schoolId) {
    issues.push({
      severity: "error",
      code: "unknown_school",
      message: "School is required for student import",
      fieldName: "school_id",
      rowNumber,
    });
  } else if (!ctx.schoolIds.includes(destination.schoolId)) {
    issues.push({
      severity: "error",
      code: "unknown_school",
      message: "Unknown or inaccessible school",
      fieldName: "school_id",
      rowNumber,
    });
  }

  if (destination.campusId) {
    const campuses = ctx.campusIdsBySchool.get(destination.schoolId);
    if (!campuses?.has(destination.campusId)) {
      issues.push({
        severity: "error",
        code: "unknown_campus",
        message: "Unknown campus for selected school",
        fieldName: "campus_id",
        rowNumber,
      });
    }
  }

  const programRaw =
    (mapped.program as string) || destination.program || "";
  if (programRaw) {
    const program = parseProgramValue(programRaw);
    if (!program || !ctx.programCodes.has(program)) {
      issues.push({
        severity: "error",
        code: "unknown_program",
        message: `Unknown program "${programRaw}"`,
        fieldName: "program",
        rowNumber,
        resolutionHint: "Use a canonical Academy program code",
      });
    } else {
      mapped.program = program;
    }
  } else {
    issues.push({
      severity: "error",
      code: "unknown_program",
      message: "Program is required (set destination program or map Program column)",
      fieldName: "program",
      rowNumber,
    });
  }

  if (destination.schoolYearId) {
    const years = ctx.schoolYearIdsBySchool.get(destination.schoolId);
    if (!years?.has(destination.schoolYearId)) {
      issues.push({
        severity: "warning",
        code: "unknown_school_year",
        message: "School year not found for selected school",
        fieldName: "school_year_id",
        rowNumber,
      });
    }
  }

  const gradeRaw = mapped.grade_level as string | undefined;
  if (gradeRaw && String(gradeRaw).trim()) {
    const grade = normalizeGrade(gradeRaw);
    if (!grade) {
      issues.push({
        severity: "error",
        code: "invalid_grade",
        message: `Invalid grade "${gradeRaw}"`,
        fieldName: "grade_level",
        rowNumber,
      });
    } else {
      mapped.grade_level = grade;
    }
  }

  const parentEmail = String(mapped.parent_email ?? "").trim();
  const parentName = String(mapped.parent_name ?? "").trim();
  const parentPhone = String(mapped.parent_phone ?? "").trim();
  if (!parentEmail && !parentName && !parentPhone) {
    issues.push({
      severity: "warning",
      code: "missing_parent",
      message: "Missing parent contact — family will be created with limited info",
      fieldName: "parent_email",
      rowNumber,
    });
  }

  // Duplicate against existing students
  const first = String(mapped.first_name ?? "").trim().toLowerCase();
  const last = String(mapped.last_name ?? "").trim().toLowerCase();
  const dob = String(mapped.date_of_birth ?? "").trim();
  if (first && last) {
    const match = ctx.existingStudents.find(
      (s) =>
        s.school_id === destination.schoolId &&
        s.first_name.toLowerCase() === first &&
        s.last_name.toLowerCase() === last &&
        (!dob || !s.date_of_birth || s.date_of_birth === dob)
    );
    if (match) {
      issues.push({
        severity: "warning",
        code: "duplicate_student",
        message: `Matches existing student (${match.first_name} ${match.last_name})`,
        rowNumber,
        resolutionHint: "Choose Update, Skip, or Merge in import mode",
      });
      mapped._existing_student_id = match.id;
    }
  }

  if (parentEmail) {
    const emailLower = parentEmail.toLowerCase();
    const guardianHit = ctx.existingGuardians.find(
      (g) => (g.email ?? "").toLowerCase() === emailLower
    );
    if (guardianHit) {
      issues.push({
        severity: "info",
        code: "existing_parent_email",
        message: "Parent email already exists — student will link to existing family",
        fieldName: "parent_email",
        rowNumber,
      });
      mapped._existing_family_id = guardianHit.family_id;
      mapped._existing_guardian_id = guardianHit.id;
    }
  }

  const { issue: scholarshipIssue, match } = scholarshipValidationIssue(
    mapped.scholarship as string,
    rowNumber,
    ctx
  );
  if (scholarshipIssue) issues.push(scholarshipIssue);
  if (match.code) mapped._funding_code = match.code;

  return issues;
}

export function resolveStudentPreviewAction(
  mapped: Record<string, unknown>,
  _ctx: ImportLookupContext,
  destination: ImportDestination
): {
  action: "create" | "update" | "skip" | "merge" | "ask";
  targetEntityId?: string | null;
  highlight: "new" | "updated" | "duplicate" | "skipped" | "error";
} {
  const existingId = mapped._existing_student_id as string | undefined;
  if (!existingId) {
    return { action: "create", highlight: "new" };
  }

  if (destination.importMode === "merge_duplicates") {
    return { action: "merge", targetEntityId: existingId, highlight: "updated" };
  }
  if (destination.importMode === "update_existing") {
    return { action: "update", targetEntityId: existingId, highlight: "updated" };
  }
  if (destination.importMode === "ask_during_preview") {
    return { action: "ask", targetEntityId: existingId, highlight: "duplicate" };
  }
  if (destination.importMode === "skip_duplicates" || destination.importMode === "create_only") {
    return { action: "skip", targetEntityId: existingId, highlight: "duplicate" };
  }
  return { action: "update", targetEntityId: existingId, highlight: "updated" };
}
