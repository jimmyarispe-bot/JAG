import type { EducationPolicyResult } from "../../policy";
import type { EducationContributorResult } from "../framework";
import { FUNDING_READINESS_CONTRIBUTOR_ID } from "../funding-readiness";
import { OPERATIONAL_READINESS_CONTRIBUTOR_ID } from "../operational-readiness";
import { STUDENT_SUCCESS_CONTRIBUTOR_ID } from "../student-success";
import { SUPPORT_PLANNING_CONTRIBUTOR_ID } from "../support-planning";
import { CAMPUS_PERFORMANCE_CONTRIBUTOR_ID } from "./CampusPerformanceTypes";

export interface CampusUnitSnapshot {
  campusId: string;
  label?: string;
  programId?: string;
  /** 0–1 performance score when supplied by host. */
  score?: number;
  trend?: "improving" | "stable" | "declining";
  tags?: readonly string[];
}

export interface CampusPerformanceInputs {
  subjectId: string;
  organizationId?: string;
  kind?: "synthesis";
  studentSuccess?: EducationContributorResult;
  supportPlanning?: EducationContributorResult;
  operationalReadiness?: EducationContributorResult;
  fundingReadiness?: EducationContributorResult;
  campuses?: readonly CampusUnitSnapshot[];
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildCampusPerformanceInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): CampusPerformanceInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  const campuses = parseCampuses(input.attributes);
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "synthesis",
    studentSuccess: byId.get(STUDENT_SUCCESS_CONTRIBUTOR_ID),
    supportPlanning: byId.get(SUPPORT_PLANNING_CONTRIBUTOR_ID),
    operationalReadiness: byId.get(OPERATIONAL_READINESS_CONTRIBUTOR_ID),
    fundingReadiness: byId.get(FUNDING_READINESS_CONTRIBUTOR_ID),
    campuses,
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      synthesisContributorId: CAMPUS_PERFORMANCE_CONTRIBUTOR_ID,
    },
  };
}

export function countCampusPerformanceUpstream(
  inputs: CampusPerformanceInputs
): number {
  return [
    inputs.studentSuccess,
    inputs.supportPlanning,
    inputs.operationalReadiness,
    inputs.fundingReadiness,
  ].filter(Boolean).length;
}

function parseCampuses(
  attributes?: Readonly<Record<string, unknown>>
): CampusUnitSnapshot[] | undefined {
  const raw = attributes?.campuses;
  if (!Array.isArray(raw)) return undefined;
  const units: CampusUnitSnapshot[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.campusId !== "string" || !row.campusId.trim()) continue;
    units.push({
      campusId: row.campusId,
      label: typeof row.label === "string" ? row.label : undefined,
      programId: typeof row.programId === "string" ? row.programId : undefined,
      score: typeof row.score === "number" ? row.score : undefined,
      trend:
        row.trend === "improving" ||
        row.trend === "stable" ||
        row.trend === "declining"
          ? row.trend
          : undefined,
      tags: Array.isArray(row.tags)
        ? row.tags.filter((t): t is string => typeof t === "string")
        : undefined,
    });
  }
  return units.length > 0 ? units : undefined;
}
