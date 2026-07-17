/**
 * Enrollment domain end-to-end organizational lifecycle workflow.
 */

import {
  createDomainWorkflow,
  DomainWorkflow,
  type DomainWorkflowDependencies,
} from "@/lib/platform/executive-workflows/domain-workflow";

export function createEnrollmentWorkflow(
  dependencies: DomainWorkflowDependencies = {}
): DomainWorkflow {
  return createDomainWorkflow("enrollment", dependencies);
}

export { DomainWorkflow };
export type { DomainWorkflowDependencies };
