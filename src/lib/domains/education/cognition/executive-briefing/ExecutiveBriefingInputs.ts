import type { EducationPolicyResult } from "../../policy";
import type { EducationContributorResult } from "../framework";
import { CAMPUS_PERFORMANCE_CONTRIBUTOR_ID } from "../campus-performance";
import { FUNDING_READINESS_CONTRIBUTOR_ID } from "../funding-readiness";
import { OPERATIONAL_READINESS_CONTRIBUTOR_ID } from "../operational-readiness";
import { SCHOOL_HEALTH_CONTRIBUTOR_ID } from "../school-health";
import { SUPPORT_PLANNING_CONTRIBUTOR_ID } from "../support-planning";
import { EXECUTIVE_BRIEFING_CONTRIBUTOR_ID } from "./ExecutiveBriefingTypes";

export interface ExecutiveBriefingInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "TOP_LEVEL_SYNTHESIS";
  schoolHealth?: EducationContributorResult;
  campusPerformance?: EducationContributorResult;
  fundingReadiness?: EducationContributorResult;
  supportPlanning?: EducationContributorResult;
  operationalReadiness?: EducationContributorResult;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildExecutiveBriefingInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): ExecutiveBriefingInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "TOP_LEVEL_SYNTHESIS",
    schoolHealth: byId.get(SCHOOL_HEALTH_CONTRIBUTOR_ID),
    campusPerformance: byId.get(CAMPUS_PERFORMANCE_CONTRIBUTOR_ID),
    fundingReadiness: byId.get(FUNDING_READINESS_CONTRIBUTOR_ID),
    supportPlanning: byId.get(SUPPORT_PLANNING_CONTRIBUTOR_ID),
    operationalReadiness: byId.get(OPERATIONAL_READINESS_CONTRIBUTOR_ID),
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      synthesisContributorId: EXECUTIVE_BRIEFING_CONTRIBUTOR_ID,
      contributorKind: "TOP_LEVEL_SYNTHESIS",
    },
  };
}

export function countExecutiveBriefingUpstream(
  inputs: ExecutiveBriefingInputs
): number {
  return [
    inputs.schoolHealth,
    inputs.campusPerformance,
    inputs.fundingReadiness,
    inputs.supportPlanning,
    inputs.operationalReadiness,
  ].filter(Boolean).length;
}
