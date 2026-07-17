/**
 * Operations domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/executive-workflows/domain-workflow";

export function createOperationsWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("operations", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
