/**
 * Education capability catalog — what the domain can reason about.
 * Knowledge metadata only; not contributor registration.
 */

export interface EducationCapabilityDefinition {
  /** Stable id, e.g. education.capability.enrollment */
  id: string;
  name: string;
  description: string;
  /** Related entity concept ids. */
  relatedEntityIds?: readonly string[];
  /** Related policy ids (definitions). */
  relatedPolicyIds?: readonly string[];
  /** Optional future contributor id hint (not a binding). */
  contributorIdHint?: string;
  tags?: readonly string[];
}

export const EDUCATION_CAPABILITY_IDS = {
  enrollment: "education.capability.enrollment",
  attendance: "education.capability.attendance",
  academicProgress: "education.capability.academic_progress",
  scheduling: "education.capability.scheduling",
  staffing: "education.capability.staffing",
  capacity: "education.capability.capacity",
  operationalReadiness: "education.capability.operational_readiness",
  interventions: "education.capability.interventions",
  familyEngagement: "education.capability.family_engagement",
  scholarships: "education.capability.scholarships",
  compliance: "education.capability.compliance",
  fundingReadiness: "education.capability.funding_readiness",
  /** Executive Intelligence (D5.3) */
  schoolHealth: "education.capability.school_health",
  campusPerformance: "education.capability.campus_performance",
  executiveBriefing: "education.capability.executive_briefing",
} as const;

export const EDUCATION_CAPABILITY_CATALOG: readonly EducationCapabilityDefinition[] =
  [
    {
      id: EDUCATION_CAPABILITY_IDS.enrollment,
      name: "Enrollment",
      description: "Reason about enrollment readiness, requirements, and proposals.",
      relatedEntityIds: [
        "education.entity.student",
        "education.entity.family",
        "education.entity.program",
        "education.entity.enrollment",
        "education.entity.campus",
      ],
      relatedPolicyIds: [
        "education.policy.enrollment.documents_required",
        "education.policy.enrollment.capacity",
      ],
      contributorIdHint: "education.cognition.enrollment",
      tags: ["admissions"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.attendance,
      name: "Attendance",
      description: "Reason about attendance patterns, thresholds, and interventions.",
      relatedEntityIds: [
        "education.entity.student",
        "education.entity.session",
        "education.entity.attendance_record",
      ],
      relatedPolicyIds: [
        "education.policy.attendance.minimum_rate",
        "education.policy.attendance.chronic_absence",
      ],
      contributorIdHint: "education.cognition.attendance",
      tags: ["operations"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.academicProgress,
      name: "Academic Progress",
      description: "Reason about progress records, goals, and assessments.",
      relatedEntityIds: [
        "education.entity.student",
        "education.entity.progress_record",
        "education.entity.goal",
        "education.entity.assessment",
      ],
      relatedPolicyIds: ["education.policy.graduation.credits"],
      tags: ["learning"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.scheduling,
      name: "Scheduling",
      description: "Reason about classes, sessions, and campus schedules.",
      relatedEntityIds: [
        "education.entity.class",
        "education.entity.session",
        "education.entity.section",
        "education.entity.classroom",
        "education.entity.instructional_block",
        "education.entity.bell_schedule",
        "education.entity.course",
        "education.entity.campus",
        "education.entity.teacher",
      ],
      relatedPolicyIds: [
        "education.policy.operations.session_overlap",
        "education.policy.operations.instructional_coverage",
      ],
      contributorIdHint: "education.cognition.scheduling",
      tags: ["operations"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.staffing,
      name: "Staffing",
      description:
        "Reason about instructional staffing, assignments, certifications, and load.",
      relatedEntityIds: [
        "education.entity.teacher",
        "education.entity.teaching_assignment",
        "education.entity.instructional_load",
        "education.entity.program",
      ],
      relatedPolicyIds: [
        "education.policy.operations.teacher_load",
        "education.policy.operations.program_staffing_requirements",
      ],
      contributorIdHint: "education.cognition.staffing",
      tags: ["operations", "staffing"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.capacity,
      name: "Capacity",
      description:
        "Reason about instructional capacity utilization across programs and campuses.",
      relatedEntityIds: [
        "education.entity.capacity_unit",
        "education.entity.section",
        "education.entity.program",
        "education.entity.campus",
        "education.entity.classroom",
      ],
      relatedPolicyIds: ["education.policy.operations.maximum_class_size"],
      contributorIdHint: "education.cognition.capacity",
      tags: ["operations", "capacity"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.operationalReadiness,
      name: "Operational Readiness",
      description:
        "Synthesize scheduling, staffing, and capacity into overall operational readiness.",
      relatedEntityIds: [
        "education.entity.section",
        "education.entity.teaching_assignment",
        "education.entity.capacity_unit",
        "education.entity.campus",
      ],
      contributorIdHint: "education.cognition.operational_readiness",
      tags: ["operations", "synthesis"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.interventions,
      name: "Interventions",
      description: "Reason about intervention need and targeting.",
      relatedEntityIds: [
        "education.entity.intervention",
        "education.entity.student",
        "education.entity.attendance_record",
        "education.entity.progress_record",
      ],
      tags: ["support"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.familyEngagement,
      name: "Family Engagement",
      description: "Reason about family communication and support relationships.",
      relatedEntityIds: [
        "education.entity.family",
        "education.entity.student",
      ],
      tags: ["support", "communication"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.scholarships,
      name: "Scholarships",
      description: "Reason about scholarship eligibility relative to enrollment.",
      relatedEntityIds: [
        "education.entity.scholarship",
        "education.entity.scholarship_award",
        "education.entity.funding_source",
        "education.entity.eligibility_rule",
        "education.entity.renewal_cycle",
        "education.entity.funding_period",
        "education.entity.enrollment",
        "education.entity.student",
      ],
      relatedPolicyIds: [
        "education.policy.scholarship.eligibility",
        "education.policy.funding.renewal_requirements",
        "education.policy.funding.deadlines",
      ],
      contributorIdHint: "education.cognition.scholarship",
      tags: ["finance", "funding"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.compliance,
      name: "Compliance",
      description: "Reason about education compliance and policy coverage.",
      relatedEntityIds: [
        "education.entity.program",
        "education.entity.student",
        "education.entity.enrollment",
        "education.entity.compliance_requirement",
        "education.entity.supporting_documentation",
      ],
      relatedPolicyIds: [
        "education.policy.compliance.required_documentation",
        "education.policy.compliance.thresholds",
      ],
      contributorIdHint: "education.cognition.compliance",
      tags: ["governance", "compliance"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.fundingReadiness,
      name: "Funding Readiness",
      description:
        "Synthesize scholarship and compliance posture into funding readiness.",
      relatedEntityIds: [
        "education.entity.scholarship_award",
        "education.entity.compliance_requirement",
        "education.entity.funding_period",
        "education.entity.enrollment",
      ],
      contributorIdHint: "education.cognition.funding_readiness",
      tags: ["finance", "compliance", "synthesis"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.schoolHealth,
      name: "School Health",
      description:
        "Assess overall organizational health from student, support, operations, and funding signals.",
      relatedEntityIds: [
        "education.entity.campus",
        "education.entity.district",
        "education.entity.network",
        "education.entity.executive_kpi",
        "education.entity.performance_indicator",
      ],
      relatedPolicyIds: [
        "education.policy.executive.network_goals",
        "education.policy.executive.thresholds",
        "education.policy.executive.strategic_priorities",
        "education.policy.executive.performance_targets",
      ],
      contributorIdHint: "education.cognition.school_health",
      tags: ["executive", "health", "synthesis"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.campusPerformance,
      name: "Campus Performance",
      description:
        "Compare and evaluate performance across schools, campuses, or programs.",
      relatedEntityIds: [
        "education.entity.campus",
        "education.entity.program",
        "education.entity.district",
        "education.entity.network",
        "education.entity.performance_indicator",
        "education.entity.executive_kpi",
      ],
      relatedPolicyIds: [
        "education.policy.executive.performance_targets",
        "education.policy.executive.thresholds",
      ],
      contributorIdHint: "education.cognition.campus_performance",
      tags: ["executive", "performance", "comparative"],
    },
    {
      id: EDUCATION_CAPABILITY_IDS.executiveBriefing,
      name: "Executive Education Briefing",
      description:
        "Top-level executive synthesis of school health, campus performance, and readiness postures.",
      relatedEntityIds: [
        "education.entity.network",
        "education.entity.district",
        "education.entity.strategic_goal",
        "education.entity.executive_kpi",
        "education.entity.performance_indicator",
      ],
      relatedPolicyIds: [
        "education.policy.executive.network_goals",
        "education.policy.executive.thresholds",
        "education.policy.executive.strategic_priorities",
        "education.policy.executive.performance_targets",
      ],
      contributorIdHint: "education.cognition.executive_briefing",
      tags: ["executive", "briefing", "top_level_synthesis"],
    },
  ] as const;

export function educationCapabilityById(): ReadonlyMap<
  string,
  EducationCapabilityDefinition
> {
  return new Map(EDUCATION_CAPABILITY_CATALOG.map((c) => [c.id, c]));
}
