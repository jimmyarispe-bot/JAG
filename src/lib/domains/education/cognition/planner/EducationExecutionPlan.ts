/**
 * Ordered execution plan for Education cognitive contributors.
 * Plan only — no contributor execution.
 */

import type { EducationExecutionNode } from "./EducationExecutionNode";
import type { EducationDependencyEdge } from "./EducationDependencyGraph";

export interface EducationExecutionStage {
  stage: number;
  /** Contributor ids scheduled in this stage (same stage = no mutual deps). */
  contributorIds: readonly string[];
}

export interface EducationExecutionPlan {
  planId: string;
  intentId: string;
  /** Included contributors in execution order. */
  orderedContributorIds: readonly string[];
  nodes: readonly EducationExecutionNode[];
  stages: readonly EducationExecutionStage[];
  dependencyEdges: readonly EducationDependencyEdge[];
  skippedContributorIds: readonly string[];
  expectedOutputs: readonly string[];
  createdAt: string;
}
