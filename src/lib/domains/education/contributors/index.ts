/**
 * Education contributor factory.
 */

import { createEducationActionContributor } from "../actions";
import { createAttendanceContributor } from "../cognition/attendance";
import { createEducationCognitiveContributor } from "../cognition";
import { createEnrollmentContributor } from "../cognition/enrollment";
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
  createEducationCognitiveContributor,
  createEnrollmentContributor,
  createEducationContextContributor,
  createEducationEvidenceContributor,
  createEducationExperienceContributor,
  createEducationIntentContributor,
  createEducationMemoryContributor,
  createEducationTwinContributor,
};
