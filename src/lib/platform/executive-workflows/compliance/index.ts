/**
 * Compliance domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/executive-workflows/domain-workflow";

export function createComplianceWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("compliance", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
