import type { EducationPolicyResult } from "../../policy";
import type { EducationContributorResult } from "../framework";
import { COMPLIANCE_CONTRIBUTOR_ID } from "../compliance";
import { ENROLLMENT_CONTRIBUTOR_ID } from "../enrollment";
import { SCHOLARSHIP_CONTRIBUTOR_ID } from "../scholarship";
import { FUNDING_READINESS_CONTRIBUTOR_ID } from "./FundingReadinessTypes";

export interface FundingReadinessInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "synthesis";
  scholarship?: EducationContributorResult;
  compliance?: EducationContributorResult;
  enrollment?: EducationContributorResult;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildFundingReadinessInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): FundingReadinessInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "synthesis",
    scholarship: byId.get(SCHOLARSHIP_CONTRIBUTOR_ID),
    compliance: byId.get(COMPLIANCE_CONTRIBUTOR_ID),
    enrollment: byId.get(ENROLLMENT_CONTRIBUTOR_ID),
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      synthesisContributorId: FUNDING_READINESS_CONTRIBUTOR_ID,
    },
  };
}

export function countFundingUpstream(inputs: FundingReadinessInputs): number {
  return [inputs.scholarship, inputs.compliance, inputs.enrollment].filter(
    Boolean
  ).length;
}
