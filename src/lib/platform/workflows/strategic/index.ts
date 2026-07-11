/**
 * Strategic domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/workflows/domain-workflow";

export function createStrategicWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("strategic", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
