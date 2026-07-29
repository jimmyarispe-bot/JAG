/**
 * A single planned contributor execution step.
 */

import type { EducationGraphNodeKind } from "../graph";

export type EducationExecutionDecision = "include" | "skip";

export interface EducationExecutionNode {
  /** Stable plan node id. */
  id: string;
  contributorId: string;
  nodeKind: EducationGraphNodeKind;
  stage: number;
  order: number;
  decision: EducationExecutionDecision;
  /** Why this contributor was included or skipped. */
  reason: string;
  /** Contributor ids that must complete before this node. */
  dependsOn: readonly string[];
  /** Expected output tokens (evidence / recommendations / proposals). */
  expectedOutputs: readonly string[];
  capabilities: readonly string[];
}
