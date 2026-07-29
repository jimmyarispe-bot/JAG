/**
 * Canonical Education Capability Pack manifests.
 * Declarative registration data only — does not wire Runtime contributors.
 */

import { EDUCATION_CAPABILITY_IDS } from "../knowledge";
import { EDUCATION_POLICY_IDS } from "../knowledge";
import { EDUCATION_CONTRIBUTOR_IDS, EDUCATION_INTENT_IDS } from "../types";
import {
  EDUCATION_CAPABILITY_PACK_IDS,
  type EducationCapabilityPackMetadata,
} from "./EducationCapabilityMetadata";

/** Student Lifecycle — Enrollment, Attendance, Progress, Student Success. */
export const STUDENT_LIFECYCLE_CAPABILITY_PACK: EducationCapabilityPackMetadata =
  {
    id: EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
    name: "Student Lifecycle",
    version: "1.0.0",
    description:
      "Core learner lifecycle intelligence: enrollment readiness, attendance patterns, academic progress, and cross-domain student success synthesis.",
    contributors: [
      EDUCATION_CONTRIBUTOR_IDS.enrollmentCognition,
      EDUCATION_CONTRIBUTOR_IDS.attendanceCognition,
      EDUCATION_CONTRIBUTOR_IDS.progressCognition,
      EDUCATION_CONTRIBUTOR_IDS.studentSuccessCognition,
    ],
    plannerIntents: [
      EDUCATION_INTENT_IDS.enroll,
      EDUCATION_INTENT_IDS.assess,
      EDUCATION_INTENT_IDS.review,
      "education.attendance.review",
      "education.student_success.review",
      "education.quarterly.review",
      "education.advisor.briefing",
      "education.leadership.brief",
    ],
    knowledgeExtensions: [
      EDUCATION_CAPABILITY_IDS.enrollment,
      EDUCATION_CAPABILITY_IDS.attendance,
      EDUCATION_CAPABILITY_IDS.academicProgress,
    ],
    policyExtensions: [
      EDUCATION_POLICY_IDS.enrollmentDocumentsRequired,
      EDUCATION_POLICY_IDS.enrollmentCapacity,
      EDUCATION_POLICY_IDS.attendanceMinimumRate,
      EDUCATION_POLICY_IDS.attendanceChronicAbsence,
      EDUCATION_POLICY_IDS.graduationCredits,
    ],
    documentation: [
      "capabilities/01_STUDENT_LIFECYCLE.md",
      "intelligence/01_ENROLLMENT_INTELLIGENCE.md",
      "intelligence/03_ATTENDANCE_INTELLIGENCE.md",
      "intelligence/08_ACADEMIC_PROGRESS_INTELLIGENCE.md",
      "intelligence/09_STUDENT_SUCCESS_INTELLIGENCE.md",
    ],
    dependencies: [],
    maturity: "feature-complete",
    tags: ["lifecycle", "enrollment", "attendance", "progress", "success"],
  };

/** Student Support — Intervention, Family Engagement, Support Planning. */
export const STUDENT_SUPPORT_CAPABILITY_PACK: EducationCapabilityPackMetadata =
  {
    id: EDUCATION_CAPABILITY_PACK_IDS.studentSupport,
    name: "Student Support",
    version: "1.0.0",
    description:
      "Support capability pack: intervention candidates, family engagement opportunities, and unified support planning synthesis over lifecycle outputs.",
    contributors: [
      EDUCATION_CONTRIBUTOR_IDS.interventionCognition,
      EDUCATION_CONTRIBUTOR_IDS.familyEngagementCognition,
      EDUCATION_CONTRIBUTOR_IDS.supportPlanningCognition,
    ],
    plannerIntents: [
      EDUCATION_INTENT_IDS.support,
      EDUCATION_INTENT_IDS.communicate,
      "education.support.review",
      "education.intervention.planning",
      "education.family.meeting",
      "education.mtss.review",
      "education.student_services.review",
    ],
    knowledgeExtensions: [
      EDUCATION_CAPABILITY_IDS.interventions,
      EDUCATION_CAPABILITY_IDS.familyEngagement,
    ],
    policyExtensions: [
      EDUCATION_POLICY_IDS.attendanceMinimumRate,
      EDUCATION_POLICY_IDS.attendanceChronicAbsence,
    ],
    documentation: [
      "capabilities/02_STUDENT_SUPPORT.md",
      "intelligence/10_STUDENT_SUPPORT_CAPABILITY.md",
    ],
    dependencies: [EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle],
    maturity: "feature-complete",
    tags: ["support", "intervention", "family", "mtss"],
  };

/** Academic Operations — Scheduling, Staffing, Capacity, Operational Readiness. */
export const ACADEMIC_OPERATIONS_CAPABILITY_PACK: EducationCapabilityPackMetadata =
  {
    id: EDUCATION_CAPABILITY_PACK_IDS.academicOperations,
    name: "Academic Operations",
    version: "0.1.0",
    description:
      "Operational delivery intelligence: scheduling conflicts/coverage, staffing load and qualifications, capacity utilization, and operational readiness synthesis.",
    contributors: [
      EDUCATION_CONTRIBUTOR_IDS.schedulingCognition,
      EDUCATION_CONTRIBUTOR_IDS.staffingCognition,
      EDUCATION_CONTRIBUTOR_IDS.capacityCognition,
      EDUCATION_CONTRIBUTOR_IDS.operationalReadinessCognition,
    ],
    plannerIntents: [
      EDUCATION_INTENT_IDS.plan,
      "education.operations.daily_review",
      "education.scheduling.review",
      "education.staffing.review",
      "education.capacity.review",
      "education.semester.planning",
      "education.leadership.operations_brief",
    ],
    knowledgeExtensions: [
      EDUCATION_CAPABILITY_IDS.scheduling,
      EDUCATION_CAPABILITY_IDS.staffing,
      EDUCATION_CAPABILITY_IDS.capacity,
      EDUCATION_CAPABILITY_IDS.operationalReadiness,
    ],
    policyExtensions: [
      EDUCATION_POLICY_IDS.maximumClassSize,
      EDUCATION_POLICY_IDS.teacherLoad,
      EDUCATION_POLICY_IDS.programStaffingRequirements,
      EDUCATION_POLICY_IDS.instructionalCoverage,
      EDUCATION_POLICY_IDS.sessionOverlap,
    ],
    documentation: [
      "intelligence/11_ACADEMIC_OPERATIONS_CAPABILITY.md",
    ],
    dependencies: [EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle],
    maturity: "building",
    tags: ["operations", "scheduling", "staffing", "capacity"],
  };

/** Funding & Compliance — Scholarship, Compliance, Funding Readiness. */
export const FUNDING_COMPLIANCE_CAPABILITY_PACK: EducationCapabilityPackMetadata =
  {
    id: EDUCATION_CAPABILITY_PACK_IDS.fundingCompliance,
    name: "Funding & Compliance",
    version: "0.1.0",
    description:
      "Funding and compliance intelligence: scholarship eligibility/renewal, compliance obligations, and funding readiness synthesis.",
    contributors: [
      EDUCATION_CONTRIBUTOR_IDS.scholarshipCognition,
      EDUCATION_CONTRIBUTOR_IDS.complianceCognition,
      EDUCATION_CONTRIBUTOR_IDS.fundingReadinessCognition,
    ],
    plannerIntents: [
      "education.scholarship.review",
      "education.funding.review",
      "education.compliance.review",
      "education.eligibility.annual",
      "education.funding.audit",
      "education.funding.executive_brief",
    ],
    knowledgeExtensions: [
      EDUCATION_CAPABILITY_IDS.scholarships,
      EDUCATION_CAPABILITY_IDS.compliance,
      EDUCATION_CAPABILITY_IDS.fundingReadiness,
    ],
    policyExtensions: [
      EDUCATION_POLICY_IDS.scholarshipEligibility,
      EDUCATION_POLICY_IDS.fundingRenewalRequirements,
      EDUCATION_POLICY_IDS.fundingRequiredDocumentation,
      EDUCATION_POLICY_IDS.fundingDeadlines,
      EDUCATION_POLICY_IDS.complianceRequiredDocumentation,
      EDUCATION_POLICY_IDS.complianceThresholds,
    ],
    documentation: ["intelligence/12_FUNDING_COMPLIANCE_CAPABILITY.md"],
    dependencies: [
      EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
      EDUCATION_CAPABILITY_PACK_IDS.academicOperations,
    ],
    maturity: "building",
    tags: ["funding", "scholarship", "compliance"],
  };

/** Executive Intelligence — School Health, Campus Performance, Executive Briefing. */
export const EXECUTIVE_INTELLIGENCE_CAPABILITY_PACK: EducationCapabilityPackMetadata =
  {
    id: EDUCATION_CAPABILITY_PACK_IDS.executiveIntelligence,
    name: "Executive Intelligence",
    version: "0.1.0",
    description:
      "Leadership-level reasoning: school health, campus performance comparison, and top-level executive education briefing.",
    contributors: [
      EDUCATION_CONTRIBUTOR_IDS.schoolHealthCognition,
      EDUCATION_CONTRIBUTOR_IDS.campusPerformanceCognition,
      EDUCATION_CONTRIBUTOR_IDS.executiveBriefingCognition,
    ],
    plannerIntents: [
      "education.executive.brief",
      "education.board.review",
      "education.quarterly.review",
      "education.annual.planning",
      "education.strategic.review",
      "education.network.health",
    ],
    knowledgeExtensions: [
      EDUCATION_CAPABILITY_IDS.schoolHealth,
      EDUCATION_CAPABILITY_IDS.campusPerformance,
      EDUCATION_CAPABILITY_IDS.executiveBriefing,
    ],
    policyExtensions: [
      EDUCATION_POLICY_IDS.networkGoals,
      EDUCATION_POLICY_IDS.executiveThresholds,
      EDUCATION_POLICY_IDS.strategicPriorities,
      EDUCATION_POLICY_IDS.performanceTargets,
    ],
    documentation: ["intelligence/13_EXECUTIVE_INTELLIGENCE_CAPABILITY.md"],
    dependencies: [
      EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle,
      EDUCATION_CAPABILITY_PACK_IDS.studentSupport,
      EDUCATION_CAPABILITY_PACK_IDS.academicOperations,
      EDUCATION_CAPABILITY_PACK_IDS.fundingCompliance,
    ],
    maturity: "feature-complete",
    tags: ["executive", "leadership", "briefing", "network"],
  };

/** Default pack manifests registered by the Education domain. */
export const EDUCATION_CAPABILITY_PACK_MANIFESTS: readonly EducationCapabilityPackMetadata[] =
  [
    STUDENT_LIFECYCLE_CAPABILITY_PACK,
    STUDENT_SUPPORT_CAPABILITY_PACK,
    ACADEMIC_OPERATIONS_CAPABILITY_PACK,
    FUNDING_COMPLIANCE_CAPABILITY_PACK,
    EXECUTIVE_INTELLIGENCE_CAPABILITY_PACK,
  ];
