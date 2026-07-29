/**
 * Canonical Education entity catalog — concepts only, no runtime objects.
 */

export interface EducationEntityDefinition {
  /** Stable id, e.g. education.entity.student */
  id: string;
  /** Preferred term (must align with vocabulary). */
  name: string;
  /** Vocabulary term id. */
  vocabularyId: string;
  description: string;
  /** Soft tags for discovery (not classifications). */
  tags?: readonly string[];
}

export const EDUCATION_ENTITY_IDS = {
  student: "education.entity.student",
  family: "education.entity.family",
  teacher: "education.entity.teacher",
  campus: "education.entity.campus",
  program: "education.entity.program",
  course: "education.entity.course",
  class: "education.entity.class",
  session: "education.entity.session",
  assessment: "education.entity.assessment",
  intervention: "education.entity.intervention",
  scholarship: "education.entity.scholarship",
  attendanceRecord: "education.entity.attendance_record",
  progressRecord: "education.entity.progress_record",
  goal: "education.entity.goal",
  enrollment: "education.entity.enrollment",
  /** Academic Operations (D5.1) */
  classroom: "education.entity.classroom",
  section: "education.entity.section",
  instructionalBlock: "education.entity.instructional_block",
  bellSchedule: "education.entity.bell_schedule",
  teachingAssignment: "education.entity.teaching_assignment",
  capacityUnit: "education.entity.capacity_unit",
  instructionalLoad: "education.entity.instructional_load",
  /** Funding & Compliance (D5.2) */
  fundingSource: "education.entity.funding_source",
  scholarshipAward: "education.entity.scholarship_award",
  eligibilityRule: "education.entity.eligibility_rule",
  complianceRequirement: "education.entity.compliance_requirement",
  renewalCycle: "education.entity.renewal_cycle",
  supportingDocumentation: "education.entity.supporting_documentation",
  fundingPeriod: "education.entity.funding_period",
  /** Executive Intelligence (D5.3) — Campus already exists above */
  district: "education.entity.district",
  network: "education.entity.network",
  strategicGoal: "education.entity.strategic_goal",
  executiveKpi: "education.entity.executive_kpi",
  performanceIndicator: "education.entity.performance_indicator",
} as const;

export type EducationEntityId =
  (typeof EDUCATION_ENTITY_IDS)[keyof typeof EDUCATION_ENTITY_IDS];

export const EDUCATION_ENTITY_CATALOG: readonly EducationEntityDefinition[] = [
  {
    id: EDUCATION_ENTITY_IDS.student,
    name: "Student",
    vocabularyId: "education.term.student",
    description: "A learner in the Education domain.",
    tags: ["person", "learner"],
  },
  {
    id: EDUCATION_ENTITY_IDS.family,
    name: "Family",
    vocabularyId: "education.term.family",
    description: "Guardians or household supporting students.",
    tags: ["person", "support"],
  },
  {
    id: EDUCATION_ENTITY_IDS.teacher,
    name: "Teacher",
    vocabularyId: "education.term.teacher",
    description: "Instructional staff member.",
    tags: ["person", "staff"],
  },
  {
    id: EDUCATION_ENTITY_IDS.campus,
    name: "Campus",
    vocabularyId: "education.term.campus",
    description: "Delivery site for education.",
    tags: ["place"],
  },
  {
    id: EDUCATION_ENTITY_IDS.program,
    name: "Program",
    vocabularyId: "education.term.program",
    description: "Educational program offering.",
    tags: ["offering"],
  },
  {
    id: EDUCATION_ENTITY_IDS.course,
    name: "Course",
    vocabularyId: "education.term.course",
    description: "Curriculum unit within a program.",
    tags: ["curriculum"],
  },
  {
    id: EDUCATION_ENTITY_IDS.class,
    name: "Class",
    vocabularyId: "education.term.class",
    description: "Scheduled instructional section.",
    tags: ["schedule"],
  },
  {
    id: EDUCATION_ENTITY_IDS.session,
    name: "Session",
    vocabularyId: "education.term.session",
    description: "Single class meeting occurrence.",
    tags: ["schedule"],
  },
  {
    id: EDUCATION_ENTITY_IDS.assessment,
    name: "Assessment",
    vocabularyId: "education.term.assessment",
    description: "Measurement of learning or readiness.",
    tags: ["measure"],
  },
  {
    id: EDUCATION_ENTITY_IDS.intervention,
    name: "Intervention",
    vocabularyId: "education.term.intervention",
    description: "Targeted support action for a student.",
    tags: ["support"],
  },
  {
    id: EDUCATION_ENTITY_IDS.scholarship,
    name: "Scholarship",
    vocabularyId: "education.term.scholarship",
    description: "Financial award related to enrollment.",
    tags: ["finance"],
  },
  {
    id: EDUCATION_ENTITY_IDS.attendanceRecord,
    name: "Attendance Record",
    vocabularyId: "education.term.attendance_record",
    description: "Attendance state for a student session.",
    tags: ["record"],
  },
  {
    id: EDUCATION_ENTITY_IDS.progressRecord,
    name: "Progress Record",
    vocabularyId: "education.term.progress_record",
    description: "Academic progress observation.",
    tags: ["record"],
  },
  {
    id: EDUCATION_ENTITY_IDS.goal,
    name: "Goal",
    vocabularyId: "education.term.goal",
    description: "Learning or outcome target.",
    tags: ["outcome"],
  },
  {
    id: EDUCATION_ENTITY_IDS.enrollment,
    name: "Enrollment",
    vocabularyId: "education.term.enrollment",
    description: "Placement of a student into a program.",
    tags: ["process"],
  },
  {
    id: EDUCATION_ENTITY_IDS.classroom,
    name: "Classroom",
    vocabularyId: "education.term.classroom",
    description: "Physical or virtual space where instruction occurs.",
    tags: ["operations", "space"],
  },
  {
    id: EDUCATION_ENTITY_IDS.section,
    name: "Section",
    vocabularyId: "education.term.section",
    description: "Scheduled offering of a course with capacity and staffing.",
    tags: ["operations"],
  },
  {
    id: EDUCATION_ENTITY_IDS.instructionalBlock,
    name: "Instructional Block",
    vocabularyId: "education.term.instructional_block",
    description: "Timed block of instruction within a bell schedule.",
    tags: ["operations", "time"],
  },
  {
    id: EDUCATION_ENTITY_IDS.bellSchedule,
    name: "Bell Schedule",
    vocabularyId: "education.term.bell_schedule",
    description: "Campus or program daily period structure.",
    tags: ["operations", "time"],
  },
  {
    id: EDUCATION_ENTITY_IDS.teachingAssignment,
    name: "Teaching Assignment",
    vocabularyId: "education.term.teaching_assignment",
    description: "Assignment of a teacher to a section or class.",
    tags: ["operations", "staffing"],
  },
  {
    id: EDUCATION_ENTITY_IDS.capacityUnit,
    name: "Capacity Unit",
    vocabularyId: "education.term.capacity_unit",
    description: "Unit of instructional capacity (seats, sections, or virtual slots).",
    tags: ["operations", "capacity"],
  },
  {
    id: EDUCATION_ENTITY_IDS.instructionalLoad,
    name: "Instructional Load",
    vocabularyId: "education.term.instructional_load",
    description: "Measured teaching load for a staff member.",
    tags: ["operations", "staffing"],
  },
  {
    id: EDUCATION_ENTITY_IDS.fundingSource,
    name: "Funding Source",
    vocabularyId: "education.term.funding_source",
    description: "Source of educational funding (scholarship, grant, or aid).",
    tags: ["finance", "funding"],
  },
  {
    id: EDUCATION_ENTITY_IDS.scholarshipAward,
    name: "Scholarship Award",
    vocabularyId: "education.term.scholarship_award",
    description: "Awarded scholarship instance for a student/enrollment.",
    tags: ["finance", "funding"],
  },
  {
    id: EDUCATION_ENTITY_IDS.eligibilityRule,
    name: "Eligibility Rule",
    vocabularyId: "education.term.eligibility_rule",
    description: "Rule concept governing funding or scholarship eligibility.",
    tags: ["finance", "policy"],
  },
  {
    id: EDUCATION_ENTITY_IDS.complianceRequirement,
    name: "Compliance Requirement",
    vocabularyId: "education.term.compliance_requirement",
    description: "Required compliance obligation for a student or program.",
    tags: ["governance", "compliance"],
  },
  {
    id: EDUCATION_ENTITY_IDS.renewalCycle,
    name: "Renewal Cycle",
    vocabularyId: "education.term.renewal_cycle",
    description: "Cycle for renewing scholarships or funding awards.",
    tags: ["finance", "funding"],
  },
  {
    id: EDUCATION_ENTITY_IDS.supportingDocumentation,
    name: "Supporting Documentation",
    vocabularyId: "education.term.supporting_documentation",
    description: "Documentation required to support funding or compliance.",
    tags: ["governance", "documents"],
  },
  {
    id: EDUCATION_ENTITY_IDS.fundingPeriod,
    name: "Funding Period",
    vocabularyId: "education.term.funding_period",
    description: "Time window during which funding applies.",
    tags: ["finance", "time"],
  },
  {
    id: EDUCATION_ENTITY_IDS.district,
    name: "District",
    vocabularyId: "education.term.district",
    description: "Administrative district spanning campuses or schools.",
    tags: ["organization", "executive"],
  },
  {
    id: EDUCATION_ENTITY_IDS.network,
    name: "Network",
    vocabularyId: "education.term.network",
    description: "Multi-campus or multi-district education network.",
    tags: ["organization", "executive"],
  },
  {
    id: EDUCATION_ENTITY_IDS.strategicGoal,
    name: "Strategic Goal",
    vocabularyId: "education.term.strategic_goal",
    description: "Leadership-level strategic objective for the network or district.",
    tags: ["executive", "strategy"],
  },
  {
    id: EDUCATION_ENTITY_IDS.executiveKpi,
    name: "Executive KPI",
    vocabularyId: "education.term.executive_kpi",
    description: "Key performance indicator tracked at executive level.",
    tags: ["executive", "kpi"],
  },
  {
    id: EDUCATION_ENTITY_IDS.performanceIndicator,
    name: "Performance Indicator",
    vocabularyId: "education.term.performance_indicator",
    description: "Measurable indicator used in campus or network performance reviews.",
    tags: ["executive", "performance"],
  },
] as const;

export function educationEntityById(): ReadonlyMap<
  string,
  EducationEntityDefinition
> {
  return new Map(EDUCATION_ENTITY_CATALOG.map((e) => [e.id, e]));
}
