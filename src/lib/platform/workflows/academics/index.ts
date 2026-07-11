/**
 * Academics domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/workflows/domain-workflow";

export function createAcademicsWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("academics", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
