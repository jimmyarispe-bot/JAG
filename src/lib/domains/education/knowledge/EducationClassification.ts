/**
 * Education classifications — controlled value sets (definitions only).
 */

export interface EducationClassificationValue {
  id: string;
  code: string;
  label: string;
  description?: string;
  /** Optional ordering hint (lower = earlier). */
  order?: number;
}

export interface EducationClassificationScheme {
  /** Stable id, e.g. education.class.program_type */
  id: string;
  name: string;
  description: string;
  values: readonly EducationClassificationValue[];
}

export const EDUCATION_CLASSIFICATION_IDS = {
  programType: "education.class.program_type",
  attendanceState: "education.class.attendance_state",
  enrollmentState: "education.class.enrollment_state",
  assessmentType: "education.class.assessment_type",
  interventionType: "education.class.intervention_type",
  communicationType: "education.class.communication_type",
} as const;

export const EDUCATION_CLASSIFICATION_CATALOG: readonly EducationClassificationScheme[] =
  [
    {
      id: EDUCATION_CLASSIFICATION_IDS.programType,
      name: "Program types",
      description: "Kinds of educational programs.",
      values: [
        {
          id: "education.class.program_type.academic",
          code: "academic",
          label: "Academic",
          order: 1,
        },
        {
          id: "education.class.program_type.enrichment",
          code: "enrichment",
          label: "Enrichment",
          order: 2,
        },
        {
          id: "education.class.program_type.remedial",
          code: "remedial",
          label: "Remedial",
          order: 3,
        },
        {
          id: "education.class.program_type.special_education",
          code: "special_education",
          label: "Special Education",
          order: 4,
        },
        {
          id: "education.class.program_type.adult",
          code: "adult",
          label: "Adult Education",
          order: 5,
        },
      ],
    },
    {
      id: EDUCATION_CLASSIFICATION_IDS.attendanceState,
      name: "Attendance states",
      description: "Canonical attendance outcomes for a session.",
      values: [
        {
          id: "education.class.attendance_state.present",
          code: "present",
          label: "Present",
          order: 1,
        },
        {
          id: "education.class.attendance_state.absent",
          code: "absent",
          label: "Absent",
          order: 2,
        },
        {
          id: "education.class.attendance_state.tardy",
          code: "tardy",
          label: "Tardy",
          order: 3,
        },
        {
          id: "education.class.attendance_state.excused",
          code: "excused",
          label: "Excused",
          order: 4,
        },
        {
          id: "education.class.attendance_state.remote",
          code: "remote",
          label: "Remote",
          order: 5,
        },
      ],
    },
    {
      id: EDUCATION_CLASSIFICATION_IDS.enrollmentState,
      name: "Enrollment states",
      description: "Lifecycle states for an enrollment.",
      values: [
        {
          id: "education.class.enrollment_state.inquiry",
          code: "inquiry",
          label: "Inquiry",
          order: 1,
        },
        {
          id: "education.class.enrollment_state.applied",
          code: "applied",
          label: "Applied",
          order: 2,
        },
        {
          id: "education.class.enrollment_state.in_review",
          code: "in_review",
          label: "In Review",
          order: 3,
        },
        {
          id: "education.class.enrollment_state.waitlisted",
          code: "waitlisted",
          label: "Waitlisted",
          order: 4,
        },
        {
          id: "education.class.enrollment_state.accepted",
          code: "accepted",
          label: "Accepted",
          order: 5,
        },
        {
          id: "education.class.enrollment_state.enrolled",
          code: "enrolled",
          label: "Enrolled",
          order: 6,
        },
        {
          id: "education.class.enrollment_state.withdrawn",
          code: "withdrawn",
          label: "Withdrawn",
          order: 7,
        },
        {
          id: "education.class.enrollment_state.rejected",
          code: "rejected",
          label: "Rejected",
          order: 8,
        },
      ],
    },
    {
      id: EDUCATION_CLASSIFICATION_IDS.assessmentType,
      name: "Assessment types",
      description: "Kinds of assessments.",
      values: [
        {
          id: "education.class.assessment_type.formative",
          code: "formative",
          label: "Formative",
          order: 1,
        },
        {
          id: "education.class.assessment_type.summative",
          code: "summative",
          label: "Summative",
          order: 2,
        },
        {
          id: "education.class.assessment_type.diagnostic",
          code: "diagnostic",
          label: "Diagnostic",
          order: 3,
        },
        {
          id: "education.class.assessment_type.placement",
          code: "placement",
          label: "Placement",
          order: 4,
        },
      ],
    },
    {
      id: EDUCATION_CLASSIFICATION_IDS.interventionType,
      name: "Intervention types",
      description: "Kinds of student interventions.",
      values: [
        {
          id: "education.class.intervention_type.academic",
          code: "academic",
          label: "Academic",
          order: 1,
        },
        {
          id: "education.class.intervention_type.attendance",
          code: "attendance",
          label: "Attendance",
          order: 2,
        },
        {
          id: "education.class.intervention_type.behavioral",
          code: "behavioral",
          label: "Behavioral",
          order: 3,
        },
        {
          id: "education.class.intervention_type.family_engagement",
          code: "family_engagement",
          label: "Family Engagement",
          order: 4,
        },
      ],
    },
    {
      id: EDUCATION_CLASSIFICATION_IDS.communicationType,
      name: "Communication types",
      description: "Kinds of education communications.",
      values: [
        {
          id: "education.class.communication_type.announcement",
          code: "announcement",
          label: "Announcement",
          order: 1,
        },
        {
          id: "education.class.communication_type.conference",
          code: "conference",
          label: "Conference",
          order: 2,
        },
        {
          id: "education.class.communication_type.alert",
          code: "alert",
          label: "Alert",
          order: 3,
        },
        {
          id: "education.class.communication_type.progress_report",
          code: "progress_report",
          label: "Progress Report",
          order: 4,
        },
      ],
    },
  ] as const;

export function educationClassificationById(): ReadonlyMap<
  string,
  EducationClassificationScheme
> {
  return new Map(EDUCATION_CLASSIFICATION_CATALOG.map((c) => [c.id, c]));
}
