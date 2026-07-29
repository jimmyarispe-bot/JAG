/**
 * Synthesis inputs — upstream contributor results (not raw observations).
 */

import type { EducationContributorResult } from "../framework";
import type { EducationPolicyResult } from "../../policy";
import {
  ATTENDANCE_CONTRIBUTOR_ID,
} from "../attendance";
import { ENROLLMENT_CONTRIBUTOR_ID } from "../enrollment";
import { PROGRESS_CONTRIBUTOR_ID } from "../progress";
import { STUDENT_SUCCESS_CONTRIBUTOR_ID } from "./StudentSuccessTypes";

/**
 * Normalized synthesis bag. Hosts or the orchestrator assemble this from
 * Enrollment / Attendance / Progress outputs.
 */
export interface StudentSuccessInputs {
  subjectId: string;
  organizationId?: string;
  /** Contributor kind marker for discovery. */
  kind?: "synthesis";
  enrollment?: EducationContributorResult;
  attendance?: EducationContributorResult;
  progress?: EducationContributorResult;
  /** Optional Policy Engine aggregate already produced upstream. */
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}

export function buildStudentSuccessInputs(input: {
  subjectId: string;
  organizationId?: string;
  upstream: ReadonlyArray<{
    contributorId: string;
    result: EducationContributorResult;
  }>;
  policyResult?: EducationPolicyResult;
  attributes?: Readonly<Record<string, unknown>>;
}): StudentSuccessInputs {
  const byId = new Map(
    input.upstream.map((u) => [u.contributorId, u.result] as const)
  );
  return {
    subjectId: input.subjectId,
    organizationId: input.organizationId,
    kind: "synthesis",
    enrollment: byId.get(ENROLLMENT_CONTRIBUTOR_ID),
    attendance: byId.get(ATTENDANCE_CONTRIBUTOR_ID),
    progress: byId.get(PROGRESS_CONTRIBUTOR_ID),
    policyResult: input.policyResult,
    attributes: {
      ...input.attributes,
      synthesisContributorId: STUDENT_SUCCESS_CONTRIBUTOR_ID,
    },
  };
}

export function countUpstreamResults(inputs: StudentSuccessInputs): number {
  return [
    inputs.enrollment,
    inputs.attendance,
    inputs.progress,
  ].filter(Boolean).length;
}
