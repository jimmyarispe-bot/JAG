/**
 * Executive domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/workflows/domain-workflow";

export function createExecutiveWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("executive", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
