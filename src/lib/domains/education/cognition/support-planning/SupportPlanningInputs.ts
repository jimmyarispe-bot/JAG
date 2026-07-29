/**
 * Support Planning inputs — Intervention / Family Engagement / Student Success.
 */

import type { EducationContributorResult } from "../framework";
import { FAMILY_ENGAGEMENT_CONTRIBUTOR_ID } from "../family-engagement";
import { INTERVENTION_CONTRIBUTOR_ID } from "../intervention";
import { STUDENT_SUCCESS_CONTRIBUTOR_ID } from "../student-success";
import { SUPPORT_PLANNING_CONTRIBUTOR_ID } from "./SupportPlanningTypes";

export interface SupportPlanningInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "synthesis";
  intervention?: EducationContributorResult;
  familyEngagement?: EducationContributorResult;
  studentSuccess?: EducationContributorResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildSupportPlanningInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  attributes?: Readonly<Record<string, unknown>>;
}): SupportPlanningInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "synthesis",
    intervention: byId.get(INTERVENTION_CONTRIBUTOR_ID),
    familyEngagement: byId.get(FAMILY_ENGAGEMENT_CONTRIBUTOR_ID),
    studentSuccess: byId.get(STUDENT_SUCCESS_CONTRIBUTOR_ID),
    attributes: {
      ...input.attributes,
      synthesisContributorId: SUPPORT_PLANNING_CONTRIBUTOR_ID,
    },
  };
}

export function countSupportPlanningUpstream(
  inputs: SupportPlanningInputs
): number {
  return [
    inputs.intervention,
    inputs.familyEngagement,
    inputs.studentSuccess,
  ].filter(Boolean).length;
}
