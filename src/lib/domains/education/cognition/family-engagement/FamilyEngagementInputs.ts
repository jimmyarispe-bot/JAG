/**
 * Family Engagement inputs — upstream contributor results.
 */

import type { EducationContributorResult } from "../framework";
import type { EducationPolicyResult } from "../../policy";
import { ATTENDANCE_CONTRIBUTOR_ID } from "../attendance";
import { ENROLLMENT_CONTRIBUTOR_ID } from "../enrollment";
import { STUDENT_SUCCESS_CONTRIBUTOR_ID } from "../student-success";
import { FAMILY_ENGAGEMENT_CONTRIBUTOR_ID } from "./FamilyEngagementTypes";

export interface FamilyEngagementInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "support";
  studentSuccess?: EducationContributorResult;
  attendance?: EducationContributorResult;
  enrollment?: EducationContributorResult;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildFamilyEngagementInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): FamilyEngagementInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "support",
    studentSuccess: byId.get(STUDENT_SUCCESS_CONTRIBUTOR_ID),
    attendance: byId.get(ATTENDANCE_CONTRIBUTOR_ID),
    enrollment: byId.get(ENROLLMENT_CONTRIBUTOR_ID),
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      supportContributorId: FAMILY_ENGAGEMENT_CONTRIBUTOR_ID,
    },
  };
}

export function countFamilyEngagementUpstream(
  inputs: FamilyEngagementInputs
): number {
  return [
    inputs.studentSuccess,
    inputs.attendance,
    inputs.enrollment,
  ].filter(Boolean).length;
}
