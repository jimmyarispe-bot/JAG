/**
 * Education policy catalog — metadata definitions only.
 * No evaluation, enforcement, or workflow logic.
 */

export type EducationPolicyKind =
  | "attendance_threshold"
  | "enrollment_requirement"
  | "scholarship_requirement"
  | "graduation_requirement"
  | "general";

export interface EducationPolicyParameter {
  key: string;
  label: string;
  /** Declared value type — not evaluated here. */
  valueType: "number" | "boolean" | "string" | "string_list" | "ratio";
  description?: string;
  /** Example / default metadata only. */
  example?: string | number | boolean | readonly string[];
  unit?: string;
}

export interface EducationPolicyDefinition {
  /** Stable id, e.g. education.policy.attendance.minimum_rate */
  id: string;
  name: string;
  kind: EducationPolicyKind;
  description: string;
  /** Related entity ids (concepts). */
  relatedEntityIds?: readonly string[];
  /** Related classification scheme ids. */
  relatedClassificationIds?: readonly string[];
  parameters: readonly EducationPolicyParameter[];
  /** Documentation notes — not executable rules. */
  notes?: string;
}

export const EDUCATION_POLICY_IDS = {
  attendanceMinimumRate: "education.policy.attendance.minimum_rate",
  attendanceChronicAbsence: "education.policy.attendance.chronic_absence",
  enrollmentDocumentsRequired:
    "education.policy.enrollment.documents_required",
  enrollmentCapacity: "education.policy.enrollment.capacity",
  scholarshipEligibility: "education.policy.scholarship.eligibility",
  graduationCredits: "education.policy.graduation.credits",
} as const;

export const EDUCATION_POLICY_CATALOG: readonly EducationPolicyDefinition[] = [
  {
    id: EDUCATION_POLICY_IDS.attendanceMinimumRate,
    name: "Minimum attendance rate",
    kind: "attendance_threshold",
    description:
      "Declares the minimum attendance rate expected for a student over a window.",
    relatedEntityIds: [
      "education.entity.student",
      "education.entity.attendance_record",
    ],
    relatedClassificationIds: ["education.class.attendance_state"],
    parameters: [
      {
        key: "minimumRate",
        label: "Minimum rate",
        valueType: "ratio",
        example: 0.9,
        unit: "ratio",
        description: "Fraction of sessions marked present (0..1).",
      },
      {
        key: "windowDays",
        label: "Window (days)",
        valueType: "number",
        example: 30,
        unit: "days",
      },
    ],
    notes: "Definition only — contributors may interpret this metadata later.",
  },
  {
    id: EDUCATION_POLICY_IDS.attendanceChronicAbsence,
    name: "Chronic absence threshold",
    kind: "attendance_threshold",
    description: "Declares the absence count that indicates chronic risk.",
    relatedEntityIds: [
      "education.entity.student",
      "education.entity.attendance_record",
    ],
    parameters: [
      {
        key: "absenceCount",
        label: "Absence count",
        valueType: "number",
        example: 8,
        unit: "sessions",
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.enrollmentDocumentsRequired,
    name: "Enrollment document requirements",
    kind: "enrollment_requirement",
    description: "Declares required document kinds for enrollment readiness.",
    relatedEntityIds: [
      "education.entity.enrollment",
      "education.entity.student",
      "education.entity.family",
    ],
    parameters: [
      {
        key: "requiredDocumentKinds",
        label: "Required document kinds",
        valueType: "string_list",
        example: ["transcript", "identification"],
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.enrollmentCapacity,
    name: "Enrollment capacity",
    kind: "enrollment_requirement",
    description: "Declares seat capacity constraints for a program/campus.",
    relatedEntityIds: [
      "education.entity.program",
      "education.entity.campus",
      "education.entity.enrollment",
    ],
    parameters: [
      {
        key: "seatsTotal",
        label: "Total seats",
        valueType: "number",
        example: 20,
      },
      {
        key: "waitlistOpen",
        label: "Waitlist open",
        valueType: "boolean",
        example: true,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.scholarshipEligibility,
    name: "Scholarship eligibility",
    kind: "scholarship_requirement",
    description: "Declares metadata for scholarship eligibility criteria.",
    relatedEntityIds: [
      "education.entity.scholarship",
      "education.entity.enrollment",
      "education.entity.student",
    ],
    parameters: [
      {
        key: "requiresReview",
        label: "Requires review",
        valueType: "boolean",
        example: true,
      },
      {
        key: "minimumGpa",
        label: "Minimum GPA",
        valueType: "number",
        example: 2.5,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.graduationCredits,
    name: "Graduation credit requirements",
    kind: "graduation_requirement",
    description: "Declares credit totals required for graduation (metadata).",
    relatedEntityIds: [
      "education.entity.student",
      "education.entity.program",
      "education.entity.progress_record",
    ],
    parameters: [
      {
        key: "requiredCredits",
        label: "Required credits",
        valueType: "number",
        example: 24,
      },
    ],
  },
] as const;

export function educationPolicyById(): ReadonlyMap<
  string,
  EducationPolicyDefinition
> {
  return new Map(EDUCATION_POLICY_CATALOG.map((p) => [p.id, p]));
}
