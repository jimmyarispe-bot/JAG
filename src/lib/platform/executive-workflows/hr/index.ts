/**
 * HR domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/executive-workflows/domain-workflow";

export function createHrWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("hr", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
