import type { EducationPolicyResult } from "../../policy";
import type { EducationContributorResult } from "../framework";
import { CAPACITY_CONTRIBUTOR_ID } from "../capacity";
import { SCHEDULING_CONTRIBUTOR_ID } from "../scheduling";
import { STAFFING_CONTRIBUTOR_ID } from "../staffing";
import { OPERATIONAL_READINESS_CONTRIBUTOR_ID } from "./OperationalReadinessTypes";

export interface OperationalReadinessInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "synthesis";
  scheduling?: EducationContributorResult;
  staffing?: EducationContributorResult;
  capacity?: EducationContributorResult;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildOperationalReadinessInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): OperationalReadinessInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "synthesis",
    scheduling: byId.get(SCHEDULING_CONTRIBUTOR_ID),
    staffing: byId.get(STAFFING_CONTRIBUTOR_ID),
    capacity: byId.get(CAPACITY_CONTRIBUTOR_ID),
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      synthesisContributorId: OPERATIONAL_READINESS_CONTRIBUTOR_ID,
    },
  };
}

export function countOperationalUpstream(
  inputs: OperationalReadinessInputs
): number {
  return [inputs.scheduling, inputs.staffing, inputs.capacity].filter(Boolean)
    .length;
}
