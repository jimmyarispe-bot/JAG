/**
 * Finance domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/executive-workflows/domain-workflow";

export function createFinanceWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("finance", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
