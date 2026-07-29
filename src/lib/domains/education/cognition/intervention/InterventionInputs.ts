/**
 * Intervention inputs — upstream contributor results (not raw observations).
 */

import type { EducationContributorResult } from "../framework";
import type { EducationPolicyResult } from "../../policy";
import { ATTENDANCE_CONTRIBUTOR_ID } from "../attendance";
import { PROGRESS_CONTRIBUTOR_ID } from "../progress";
import { STUDENT_SUCCESS_CONTRIBUTOR_ID } from "../student-success";
import { INTERVENTION_CONTRIBUTOR_ID } from "./InterventionTypes";

export interface InterventionInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "support";
  studentSuccess?: EducationContributorResult;
  progress?: EducationContributorResult;
  attendance?: EducationContributorResult;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildInterventionInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): InterventionInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "support",
    studentSuccess: byId.get(STUDENT_SUCCESS_CONTRIBUTOR_ID),
    progress: byId.get(PROGRESS_CONTRIBUTOR_ID),
    attendance: byId.get(ATTENDANCE_CONTRIBUTOR_ID),
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      supportContributorId: INTERVENTION_CONTRIBUTOR_ID,
    },
  };
}

export function countInterventionUpstream(inputs: InterventionInputs): number {
  return [
    inputs.studentSuccess,
    inputs.progress,
    inputs.attendance,
  ].filter(Boolean).length;
}
