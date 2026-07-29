/**
 * Education policy catalog — metadata definitions only.
 * No evaluation, enforcement, or workflow logic.
 */

export type EducationPolicyKind =
  | "attendance_threshold"
  | "enrollment_requirement"
  | "scholarship_requirement"
  | "graduation_requirement"
  | "operations_constraint"
  | "funding_requirement"
  | "compliance_requirement"
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
  /** Academic Operations (D5.1) — metadata only */
  maximumClassSize: "education.policy.operations.maximum_class_size",
  teacherLoad: "education.policy.operations.teacher_load",
  programStaffingRequirements:
    "education.policy.operations.program_staffing_requirements",
  instructionalCoverage: "education.policy.operations.instructional_coverage",
  sessionOverlap: "education.policy.operations.session_overlap",
  /** Funding & Compliance (D5.2) — metadata only */
  fundingRenewalRequirements:
    "education.policy.funding.renewal_requirements",
  fundingRequiredDocumentation:
    "education.policy.funding.required_documentation",
  fundingDeadlines: "education.policy.funding.deadlines",
  complianceRequiredDocumentation:
    "education.policy.compliance.required_documentation",
  complianceThresholds: "education.policy.compliance.thresholds",
  /** Executive Intelligence (D5.3) — metadata only */
  networkGoals: "education.policy.executive.network_goals",
  executiveThresholds: "education.policy.executive.thresholds",
  strategicPriorities: "education.policy.executive.strategic_priorities",
  performanceTargets: "education.policy.executive.performance_targets",
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
  {
    id: EDUCATION_POLICY_IDS.maximumClassSize,
    name: "Maximum class size",
    kind: "operations_constraint",
    description:
      "Declares maximum enrolled students per section/class (metadata only).",
    relatedEntityIds: [
      "education.entity.section",
      "education.entity.class",
      "education.entity.capacity_unit",
    ],
    parameters: [
      {
        key: "maximumSeats",
        label: "Maximum seats",
        valueType: "number",
        example: 28,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.teacherLoad,
    name: "Teacher load",
    kind: "operations_constraint",
    description:
      "Declares maximum instructional load for a teacher (metadata only).",
    relatedEntityIds: [
      "education.entity.teacher",
      "education.entity.instructional_load",
      "education.entity.teaching_assignment",
    ],
    parameters: [
      {
        key: "maximumLoad",
        label: "Maximum load",
        valueType: "number",
        example: 5,
        unit: "sections",
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.programStaffingRequirements,
    name: "Program staffing requirements",
    kind: "operations_constraint",
    description:
      "Declares staffing coverage expectations for a program (metadata only).",
    relatedEntityIds: [
      "education.entity.program",
      "education.entity.teacher",
      "education.entity.teaching_assignment",
    ],
    parameters: [
      {
        key: "minimumQualifiedTeachers",
        label: "Minimum qualified teachers",
        valueType: "number",
        example: 1,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.instructionalCoverage,
    name: "Instructional coverage",
    kind: "operations_constraint",
    description:
      "Declares that scheduled instructional blocks must have assigned coverage (metadata only).",
    relatedEntityIds: [
      "education.entity.instructional_block",
      "education.entity.teaching_assignment",
      "education.entity.session",
    ],
    parameters: [
      {
        key: "requireCoverage",
        label: "Require coverage",
        valueType: "boolean",
        example: true,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.sessionOverlap,
    name: "Session overlap",
    kind: "operations_constraint",
    description:
      "Declares constraints about overlapping sessions for teachers or rooms (metadata only).",
    relatedEntityIds: [
      "education.entity.session",
      "education.entity.classroom",
      "education.entity.teacher",
    ],
    parameters: [
      {
        key: "allowOverlap",
        label: "Allow overlap",
        valueType: "boolean",
        example: false,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.fundingRenewalRequirements,
    name: "Renewal requirements",
    kind: "funding_requirement",
    description:
      "Declares scholarship/funding renewal requirements (metadata only).",
    relatedEntityIds: [
      "education.entity.scholarship_award",
      "education.entity.renewal_cycle",
      "education.entity.eligibility_rule",
    ],
    parameters: [
      {
        key: "minimumGpa",
        label: "Minimum GPA for renewal",
        valueType: "number",
        example: 2.5,
      },
      {
        key: "requireContinuingEnrollment",
        label: "Require continuing enrollment",
        valueType: "boolean",
        example: true,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.fundingRequiredDocumentation,
    name: "Required documentation (funding)",
    kind: "funding_requirement",
    description:
      "Declares documentation required for funding awards (metadata only).",
    relatedEntityIds: [
      "education.entity.supporting_documentation",
      "education.entity.scholarship_award",
      "education.entity.funding_source",
    ],
    parameters: [
      {
        key: "requiredDocumentKinds",
        label: "Required document kinds",
        valueType: "string_list",
        example: ["transcript", "award_letter"],
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.fundingDeadlines,
    name: "Funding deadlines",
    kind: "funding_requirement",
    description: "Declares funding application/renewal deadlines (metadata only).",
    relatedEntityIds: [
      "education.entity.funding_period",
      "education.entity.scholarship_award",
    ],
    parameters: [
      {
        key: "renewalDeadlineDays",
        label: "Renewal deadline (days before period end)",
        valueType: "number",
        example: 30,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.complianceRequiredDocumentation,
    name: "Required documentation (compliance)",
    kind: "compliance_requirement",
    description:
      "Declares documentation required for compliance posture (metadata only).",
    relatedEntityIds: [
      "education.entity.compliance_requirement",
      "education.entity.supporting_documentation",
      "education.entity.student",
    ],
    parameters: [
      {
        key: "requiredDocumentKinds",
        label: "Required document kinds",
        valueType: "string_list",
        example: ["immunization", "emergency_contact"],
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.complianceThresholds,
    name: "Compliance thresholds",
    kind: "compliance_requirement",
    description:
      "Declares thresholds for attendance/assessment/participation compliance (metadata only).",
    relatedEntityIds: [
      "education.entity.compliance_requirement",
      "education.entity.student",
      "education.entity.program",
    ],
    parameters: [
      {
        key: "minimumAttendanceRate",
        label: "Minimum attendance rate",
        valueType: "ratio",
        example: 0.9,
      },
      {
        key: "requiredAssessmentsComplete",
        label: "Required assessments complete",
        valueType: "boolean",
        example: true,
      },
    ],
  },
  {
    id: EDUCATION_POLICY_IDS.networkGoals,
    name: "Network goals",
    kind: "general",
    description:
      "Declares network-level strategic goals for executive intelligence (metadata only).",
    relatedEntityIds: [
      "education.entity.network",
      "education.entity.district",
      "education.entity.strategic_goal",
    ],
    parameters: [
      {
        key: "goalIds",
        label: "Strategic goal ids",
        valueType: "string_list",
        example: ["goal.graduation", "goal.equity"],
      },
    ],
    notes: "No evaluation logic outside Policy Engine.",
  },
  {
    id: EDUCATION_POLICY_IDS.executiveThresholds,
    name: "Executive thresholds",
    kind: "general",
    description:
      "Declares executive health/risk thresholds for leadership review (metadata only).",
    relatedEntityIds: [
      "education.entity.executive_kpi",
      "education.entity.performance_indicator",
      "education.entity.network",
    ],
    parameters: [
      {
        key: "minimumHealthScore",
        label: "Minimum health score",
        valueType: "ratio",
        example: 0.7,
      },
      {
        key: "criticalRiskCount",
        label: "Critical risk count threshold",
        valueType: "number",
        example: 1,
      },
    ],
    notes: "No evaluation logic outside Policy Engine.",
  },
  {
    id: EDUCATION_POLICY_IDS.strategicPriorities,
    name: "Strategic priorities",
    kind: "general",
    description:
      "Declares ordered strategic priorities for board and annual planning (metadata only).",
    relatedEntityIds: [
      "education.entity.strategic_goal",
      "education.entity.network",
    ],
    parameters: [
      {
        key: "priorityLabels",
        label: "Priority labels",
        valueType: "string_list",
        example: ["student success", "funding stability", "operations"],
      },
    ],
    notes: "No evaluation logic outside Policy Engine.",
  },
  {
    id: EDUCATION_POLICY_IDS.performanceTargets,
    name: "Performance targets",
    kind: "general",
    description:
      "Declares campus/program performance targets for comparative review (metadata only).",
    relatedEntityIds: [
      "education.entity.campus",
      "education.entity.program",
      "education.entity.performance_indicator",
      "education.entity.executive_kpi",
    ],
    parameters: [
      {
        key: "targetScore",
        label: "Target performance score",
        valueType: "ratio",
        example: 0.85,
      },
      {
        key: "indicatorIds",
        label: "Performance indicator ids",
        valueType: "string_list",
        example: ["kpi.attendance", "kpi.progress"],
      },
    ],
    notes: "No evaluation logic outside Policy Engine.",
  },
] as const;

export function educationPolicyById(): ReadonlyMap<
  string,
  EducationPolicyDefinition
> {
  return new Map(EDUCATION_POLICY_CATALOG.map((p) => [p.id, p]));
}
