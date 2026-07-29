/**
 * Education contributor factory.
 */

import { createEducationActionContributor } from "../actions";
import { createAttendanceContributor } from "../cognition/attendance";
import { createEducationCognitiveContributor } from "../cognition";
import { createEnrollmentContributor } from "../cognition/enrollment";
import { createAcademicProgressContributor } from "../cognition/progress";
import { createCapacityContributor } from "../cognition/capacity";
import { createComplianceContributor } from "../cognition/compliance";
import { createFamilyEngagementContributor } from "../cognition/family-engagement";
import { createFundingReadinessContributor } from "../cognition/funding-readiness";
import { createInterventionContributor } from "../cognition/intervention";
import { createOperationalReadinessContributor } from "../cognition/operational-readiness";
import { createSchedulingContributor } from "../cognition/scheduling";
import { createScholarshipContributor } from "../cognition/scholarship";
import { createStaffingContributor } from "../cognition/staffing";
import { createStudentSuccessContributor } from "../cognition/student-success";
import { createSupportPlanningContributor } from "../cognition/support-planning";
import { createEducationContextContributor } from "../context";
import { createEducationEvidenceContributor } from "../evidence";
import { createEducationExperienceContributor } from "../experience";
import { createEducationIntentContributor } from "../intent";
import { createEducationMemoryContributor } from "../memory";
import { createEducationTwinContributor } from "../twin";
import { EDUCATION_CONTRIBUTOR_IDS } from "../types";

export interface EducationContributorSet {
  context: ReturnType<typeof createEducationContextContributor>;
  intent: ReturnType<typeof createEducationIntentContributor>;
  cognition: ReturnType<typeof createEducationCognitiveContributor>;
  enrollmentCognition: ReturnType<typeof createEnrollmentContributor>;
  attendanceCognition: ReturnType<typeof createAttendanceContributor>;
  progressCognition: ReturnType<typeof createAcademicProgressContributor>;
  studentSuccessCognition: ReturnType<typeof createStudentSuccessContributor>;
  interventionCognition: ReturnType<typeof createInterventionContributor>;
  familyEngagementCognition: ReturnType<typeof createFamilyEngagementContributor>;
  supportPlanningCognition: ReturnType<typeof createSupportPlanningContributor>;
  schedulingCognition: ReturnType<typeof createSchedulingContributor>;
  staffingCognition: ReturnType<typeof createStaffingContributor>;
  capacityCognition: ReturnType<typeof createCapacityContributor>;
  operationalReadinessCognition: ReturnType<
    typeof createOperationalReadinessContributor
  >;
  scholarshipCognition: ReturnType<typeof createScholarshipContributor>;
  complianceCognition: ReturnType<typeof createComplianceContributor>;
  fundingReadinessCognition: ReturnType<typeof createFundingReadinessContributor>;
  experience: ReturnType<typeof createEducationExperienceContributor>;
  action: ReturnType<typeof createEducationActionContributor>;
  evidence: ReturnType<typeof createEducationEvidenceContributor>;
  memory: ReturnType<typeof createEducationMemoryContributor>;
  twin: ReturnType<typeof createEducationTwinContributor>;
}

export function createEducationContributors(): EducationContributorSet {
  return {
    context: createEducationContextContributor(),
    intent: createEducationIntentContributor(),
    cognition: createEducationCognitiveContributor(),
    enrollmentCognition: createEnrollmentContributor(),
    attendanceCognition: createAttendanceContributor(),
    progressCognition: createAcademicProgressContributor(),
    studentSuccessCognition: createStudentSuccessContributor(),
    interventionCognition: createInterventionContributor(),
    familyEngagementCognition: createFamilyEngagementContributor(),
    supportPlanningCognition: createSupportPlanningContributor(),
    schedulingCognition: createSchedulingContributor(),
    staffingCognition: createStaffingContributor(),
    capacityCognition: createCapacityContributor(),
    operationalReadinessCognition: createOperationalReadinessContributor(),
    scholarshipCognition: createScholarshipContributor(),
    complianceCognition: createComplianceContributor(),
    fundingReadinessCognition: createFundingReadinessContributor(),
    experience: createEducationExperienceContributor(),
    action: createEducationActionContributor(),
    evidence: createEducationEvidenceContributor(),
    memory: createEducationMemoryContributor(),
    twin: createEducationTwinContributor(),
  };
}

/** Contributor ids for discovery / validation tests. */
export function listEducationContributorIds(): string[] {
  return Object.values(EDUCATION_CONTRIBUTOR_IDS);
}

export {
  createEducationActionContributor,
  createAttendanceContributor,
  createAcademicProgressContributor,
  createStudentSuccessContributor,
  createInterventionContributor,
  createFamilyEngagementContributor,
  createSupportPlanningContributor,
  createSchedulingContributor,
  createStaffingContributor,
  createCapacityContributor,
  createOperationalReadinessContributor,
  createScholarshipContributor,
  createComplianceContributor,
  createFundingReadinessContributor,
  createEducationCognitiveContributor,
  createEnrollmentContributor,
  createEducationContextContributor,
  createEducationEvidenceContributor,
  createEducationExperienceContributor,
  createEducationIntentContributor,
  createEducationMemoryContributor,
  createEducationTwinContributor,
};
