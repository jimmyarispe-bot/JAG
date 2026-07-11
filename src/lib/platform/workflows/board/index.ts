/**
 * Board domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/workflows/domain-workflow";

export function createBoardWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("board", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
