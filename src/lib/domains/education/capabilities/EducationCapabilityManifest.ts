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

/** Default pack manifests registered by the Education domain. */
export const EDUCATION_CAPABILITY_PACK_MANIFESTS: readonly EducationCapabilityPackMetadata[] =
  [STUDENT_LIFECYCLE_CAPABILITY_PACK, STUDENT_SUPPORT_CAPABILITY_PACK];
