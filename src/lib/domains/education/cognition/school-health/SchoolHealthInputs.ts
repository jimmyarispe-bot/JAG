import type { EducationPolicyResult } from "../../policy";
import type { EducationContributorResult } from "../framework";
import { FUNDING_READINESS_CONTRIBUTOR_ID } from "../funding-readiness";
import { OPERATIONAL_READINESS_CONTRIBUTOR_ID } from "../operational-readiness";
import { STUDENT_SUCCESS_CONTRIBUTOR_ID } from "../student-success";
import { SUPPORT_PLANNING_CONTRIBUTOR_ID } from "../support-planning";
import { SCHOOL_HEALTH_CONTRIBUTOR_ID } from "./SchoolHealthTypes";

export interface SchoolHealthInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "synthesis";
  studentSuccess?: EducationContributorResult;
  supportPlanning?: EducationContributorResult;
  operationalReadiness?: EducationContributorResult;
  fundingReadiness?: EducationContributorResult;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildSchoolHealthInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): SchoolHealthInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "synthesis",
    studentSuccess: byId.get(STUDENT_SUCCESS_CONTRIBUTOR_ID),
    supportPlanning: byId.get(SUPPORT_PLANNING_CONTRIBUTOR_ID),
    operationalReadiness: byId.get(OPERATIONAL_READINESS_CONTRIBUTOR_ID),
    fundingReadiness: byId.get(FUNDING_READINESS_CONTRIBUTOR_ID),
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      synthesisContributorId: SCHOOL_HEALTH_CONTRIBUTOR_ID,
    },
  };
}

export function countSchoolHealthUpstream(inputs: SchoolHealthInputs): number {
  return [
    inputs.studentSuccess,
    inputs.supportPlanning,
    inputs.operationalReadiness,
    inputs.fundingReadiness,
  ].filter(Boolean).length;
}
